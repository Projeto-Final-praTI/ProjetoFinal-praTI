package com.zelo.backend.service;

import com.zelo.backend.dto.CreateAlertRequestDTO;
import com.zelo.backend.dto.CurrentWeatherDTO;
import com.zelo.backend.dto.WeatherAlertDTO;
import com.zelo.backend.dto.WeatherBundleDTO;
import com.zelo.backend.entity.AlertScope;
import com.zelo.backend.entity.AlertSeverity;
import com.zelo.backend.entity.Incident;
import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.entity.WeatherAlert;
import com.zelo.backend.exception.EntityNotFoundException;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.repository.IncidentRepository;
import com.zelo.backend.repository.UserRepository;
import com.zelo.backend.repository.WeatherAlertRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Motor de alertas climáticos REAIS.
 *
 * Fonte única: previsão horária da Open-Meteo (grátis, sem chave de API).
 * A cada consulta, os dados reais são avaliados contra regras de thresholds
 * (chuva forte, calor extremo, vento, frio) e alertas são gerados/persistidos
 * em `weather_alerts` com deduplicação por fingerprint (regra|lat|lng).
 */
@Service
public class WeatherAlertService {

    private static final String FORECAST_URL =
            "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
                    + "&current=temperature_2m,precipitation,weathercode,windspeed_10m"
                    + "&hourly=precipitation,temperature_2m,windspeed_10m"
                    + "&forecast_days=2&timezone=auto";

    private static final String ALERT_SOURCE = "Motor de alertas ZELO (Open-Meteo)";
    private static final int MAX_NEW_ALERTS_PER_REQUEST = 3;
    private static final int FORECAST_WINDOW_HOURS = 24;

    // Thresholds configuráveis (application.yml → alerts.rules.*)
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.rain-strong-mm:7}")
    private double rainStrongMm;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.rain-extreme-mm:20}")
    private double rainExtremeMm;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.rain-accumulation-mm:60}")
    private double rainAccumulationMm;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.heat-c:35}")
    private double heatC;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.heat-extreme-c:38}")
    private double heatExtremeC;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.cold-c:2}")
    private double coldC;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.wind-strong-kmh:60}")
    private double windStrongKmh;
    @org.springframework.beans.factory.annotation.Value("${alerts.rules.wind-extreme-kmh:90}")
    private double windExtremeKmh;

    @Autowired
    private WeatherAlertRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ReverseGeocodingService reverseGeocodingService;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    /**
     * Endpoint único: 1 chamada à Open-Meteo que devolve o clima atual,
     * gera alertas reais (se as regras forem disparadas) e retorna os
     * alertas ativos próximos da localização.
     */
    public WeatherBundleDTO getWeatherBundle(Double lat, Double lng) {
        Forecast forecast = fetchForecast(lat, lng);
        if (forecast != null) {
            generateAlerts(lat, lng, forecast);
        }
        List<WeatherAlertDTO> alerts = findActiveNearby(lat, lng);
        CurrentWeatherDTO current = forecast != null ? forecast.current() : null;
        return new WeatherBundleDTO(alerts, current);
    }

    public List<WeatherAlertDTO> findActiveNearby(Double lat, Double lng) {
        return repository.findActiveNearby(lat, lng).stream()
                .map(this::toDto)
                .toList();
    }

    // ------------------------------------------------------------------
    // Alertas oficiais (gestor/root)
    // ------------------------------------------------------------------

    /** Lista os alertas oficiais ativos no escopo de quem chama. */
    public List<WeatherAlertDTO> listManualAlerts(UserDetails details) {
        User caller = requireUser(details);

        if (caller.getRole() == Role.ROOT) {
            return repository.findManualActive().stream()
                    .map(this::toDto)
                    .toList();
        }

        requireGestor(caller);
        if (caller.getCity() == null || caller.getCity().isBlank()) {
            throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
        }
        return repository.findManualActiveForCity(caller.getCity()).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Dispara um alerta oficial.
     *
     * <p>Gestor: sempre {@code LOCAL} na própria cidade. Root: {@code GLOBAL}
     * (todo o território) ou {@code LOCAL} em qualquer cidade. O alerta expira
     * sozinho após {@code durationMinutes}.
     */
    @Transactional
    public WeatherAlertDTO createManualAlert(CreateAlertRequestDTO dto, UserDetails details) {
        User caller = requireUser(details);
        AlertScope scope;
        String city;

        if (caller.getRole() == Role.ROOT) {
            scope = parseScope(dto.getScope());
            if (scope == AlertScope.LOCAL) {
                city = normalizeCity(dto.getCity());
                if (city == null) {
                    throw new IllegalArgumentException("Informe a cidade do alerta local.");
                }
            } else {
                city = null;
            }
        } else {
            requireGestor(caller);
            scope = AlertScope.LOCAL;
            city = normalizeCity(caller.getCity());
            if (city == null) {
                throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
            }
        }

        AlertSeverity severity = parseSeverity(dto.getSeverity());
        int duration = dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 60;
        if (duration < 5 || duration > 10080) {
            throw new IllegalArgumentException("Duração deve estar entre 5 minutos e 7 dias.");
        }

        Point center = null;
        Double radius = null;
        if (scope == AlertScope.LOCAL) {
            double[] coords = resolveCityCenter(city);
            if (coords == null) {
                throw new IllegalArgumentException(
                        "Não foi possível localizar a cidade \"" + city + "\". Tente novamente em instantes.");
            }
            center = geometryFactory.createPoint(new Coordinate(coords[1], coords[0]));
            center.setSRID(4326);
            radius = dto.getRadiusMeters() != null ? dto.getRadiusMeters() : 50000.0;
            if (radius < 1000 || radius > 200000) {
                throw new IllegalArgumentException("Raio deve estar entre 1 km e 200 km.");
            }
        }

        WeatherAlert alert = WeatherAlert.builder()
                .title(dto.getTitle().trim())
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .severity(severity)
                .source("Alerta oficial")
                .scope(scope)
                .city(city)
                .createdByName(caller.getFullName())
                .centerLocation(center)
                .radiusMeters(radius)
                .expiresAt(OffsetDateTime.now().plusMinutes(duration))
                .build();

        repository.save(alert);
        return toDto(alert);
    }

    /** Remove um alerta oficial (root: qualquer; gestor: local da própria cidade). */
    @Transactional
    public void deleteManualAlert(UUID id, UserDetails details) {
        WeatherAlert alert = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Alerta não encontrado"));

        if (alert.getScope() == null) {
            throw new ForbiddenOperationException(
                    "Somente alertas oficiais podem ser removidos por este endpoint.");
        }

        User caller = requireUser(details);
        if (caller.getRole() != Role.ROOT) {
            requireGestor(caller);
            boolean ownCityLocal = alert.getScope() == AlertScope.LOCAL
                    && alert.getCity() != null
                    && caller.getCity() != null
                    && alert.getCity().equalsIgnoreCase(caller.getCity());
            if (!ownCityLocal) {
                throw new ForbiddenOperationException("Você só pode remover alertas locais da sua cidade.");
            }
        }

        repository.delete(alert);
    }

    private AlertScope parseScope(String value) {
        if (value == null || value.isBlank()) return AlertScope.LOCAL;
        try {
            return AlertScope.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Abrangência inválida. Use GLOBAL ou LOCAL.");
        }
    }

    private AlertSeverity parseSeverity(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Severidade é obrigatória.");
        }
        try {
            return AlertSeverity.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Severidade inválida. Use AMARELO, LARANJA ou VERMELHO.");
        }
    }

    /**
     * Centro do município: Nominatim (cacheado) e, se falhar, a média dos
     * pontos críticos já registrados na cidade.
     */
    private double[] resolveCityCenter(String city) {
        double[] geocoded = reverseGeocodingService.resolveCityCenter(city);
        if (geocoded != null) return geocoded;

        List<Incident> incidents = incidentRepository.findByCityIgnoreCase(city);
        double lat = 0;
        double lng = 0;
        int count = 0;
        for (Incident incident : incidents) {
            if (incident.getLocation() != null) {
                lat += incident.getLocation().getY();
                lng += incident.getLocation().getX();
                count++;
            }
        }
        return count > 0 ? new double[]{lat / count, lng / count} : null;
    }

    private User requireUser(UserDetails details) {
        return userRepository.findByEmail(details.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
    }

    private void requireGestor(User user) {
        if (user.getRole() != Role.GESTOR) {
            throw new ForbiddenOperationException("Apenas gestores e root podem disparar alertas oficiais.");
        }
    }

    private String normalizeCity(String city) {
        if (city == null) return null;
        String trimmed = city.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // ------------------------------------------------------------------
    // Motor de regras
    // ------------------------------------------------------------------

    private void generateAlerts(Double lat, Double lng, Forecast forecast) {
        int start = 0;
        String hourKey = forecast.currentTime().length() >= 13
                ? forecast.currentTime().substring(0, 13) : null;
        if (hourKey != null) {
            while (start < forecast.times().size()
                    && forecast.times().get(start).substring(0, 13).compareTo(hourKey) < 0) {
                start++;
            }
        }
        int end = Math.min(forecast.times().size(), start + FORECAST_WINDOW_HOURS);
        if (start >= end) return;

        double maxPrecip = max(forecast.precipitation(), start, end);
        double sumPrecip = sum(forecast.precipitation(), start, end);
        double maxTemp = max(forecast.temperatures(), start, end);
        double minTemp = min(forecast.temperatures(), start, end);
        double maxWind = max(forecast.windSpeeds(), start, end);

        List<Rule> triggered = new ArrayList<>();

        // ------------------------- CHUVA -------------------------
        if (maxPrecip >= rainExtremeMm) {
            triggered.add(new Rule("RAIN_EXTREME", AlertSeverity.VERMELHO,
                    "Chuva extrema prevista",
                    String.format(Locale.US, "Previsão de %.1f mm/h na próxima hora. Risco alto de alagamentos e transbordamento de vias.", maxPrecip),
                    15000.0, Duration.ofHours(6)));
        } else if (maxPrecip >= rainStrongMm) {
            triggered.add(new Rule("RAIN_STRONG", AlertSeverity.LARANJA,
                    "Chuva forte prevista",
                    String.format(Locale.US, "Previsão de %.1f mm/h na próxima hora. Risco de alagamentos em vias baixas e pontos críticos.", maxPrecip),
                    15000.0, Duration.ofHours(6)));
        }
        if (sumPrecip >= rainAccumulationMm) {
            triggered.add(new Rule("RAIN_ACCUMULATION", AlertSeverity.AMARELO,
                    "Alto acumulado de chuva",
                    String.format(Locale.US, "Previsão de %.0f mm nas próximas %dh. Atenção a pontos de alagamento e áreas de risco de deslizamento.", sumPrecip, FORECAST_WINDOW_HOURS),
                    20000.0, Duration.ofHours(FORECAST_WINDOW_HOURS)));
        }

        // ------------------------- CALOR -------------------------
        if (maxTemp >= heatExtremeC) {
            triggered.add(new Rule("HEAT_EXTREME", AlertSeverity.VERMELHO,
                    "Onda de calor extrema",
                    String.format(Locale.US, "Temperatura prevista de %.1f°C nas próximas %dh. Risco grave à saúde, principalmente crianças, idosos e trabalhadores ao ar livre.", maxTemp, FORECAST_WINDOW_HOURS),
                    25000.0, Duration.ofHours(FORECAST_WINDOW_HOURS)));
        } else if (maxTemp >= heatC) {
            triggered.add(new Rule("HEAT_WAVE", AlertSeverity.LARANJA,
                    "Onda de calor",
                    String.format(Locale.US, "Temperatura prevista de %.1f°C nas próximas %dh. Hidrate-se e evite exposição ao sol entre 10h e 16h.", maxTemp, FORECAST_WINDOW_HOURS),
                    25000.0, Duration.ofHours(FORECAST_WINDOW_HOURS)));
        }

        // -------------------------- FRIO --------------------------
        if (minTemp <= coldC) {
            triggered.add(new Rule("COLD_WAVE", AlertSeverity.AMARELO,
                    "Quadro frio / geada",
                    String.format(Locale.US, "Temperatura mínima prevista de %.1f°C nas próximas %dh. Atenção a cultivos, animais e populações em situação de vulnerabilidade.", minTemp, FORECAST_WINDOW_HOURS),
                    20000.0, Duration.ofHours(FORECAST_WINDOW_HOURS)));
        }

        // -------------------------- VENTO -------------------------
        if (maxWind >= windExtremeKmh) {
            triggered.add(new Rule("WIND_EXTREME", AlertSeverity.VERMELHO,
                    "Ventos fortes previstos",
                    String.format(Locale.US, "Rajadas de até %.0f km/h previstas. Risco de quedas de árvores, telhados e estruturas.", maxWind),
                    20000.0, Duration.ofHours(12)));
        } else if (maxWind >= windStrongKmh) {
            triggered.add(new Rule("WIND_STRONG", AlertSeverity.LARANJA,
                    "Ventos intensos previstos",
                    String.format(Locale.US, "Ventos de até %.0f km/h previstos. Atenção a objetos soltos e condução em vias expostas.", maxWind),
                    20000.0, Duration.ofHours(12)));
        }

        if (triggered.isEmpty()) return;

        // Ordena por severidade (VERMELHO primeiro) e persiste sem duplicar
        triggered.sort(Comparator.comparingInt((Rule r) -> r.severity().ordinal()).reversed());
        OffsetDateTime now = OffsetDateTime.now();
        int saved = 0;
        for (Rule rule : triggered) {
            if (saved >= MAX_NEW_ALERTS_PER_REQUEST) break;
            String fingerprint = fingerprint(rule.id(), lat, lng);
            boolean alreadyActive = repository
                    .findFirstByFingerprintAndExpiresAtAfter(fingerprint, now)
                    .isPresent();
            if (alreadyActive) continue;

            Point center = geometryFactory.createPoint(new Coordinate(lng, lat));
            center.setSRID(4326);

            repository.save(WeatherAlert.builder()
                    .title(rule.title())
                    .description(rule.description())
                    .severity(rule.severity())
                    .source(ALERT_SOURCE)
                    .centerLocation(center)
                    .radiusMeters(rule.radiusMeters())
                    .expiresAt(now.plus(rule.validFor()))
                    .fingerprint(fingerprint)
                    .build());
            saved++;
        }
    }

    private String fingerprint(String ruleId, Double lat, Double lng) {
        // ~1km de precisão: evita duplicar o mesmo alerta em consultas vizinhas
        return String.format(Locale.US, "%s|%.2f|%.2f", ruleId, lat, lng);
    }

    // ------------------------------------------------------------------
    // Cliente Open-Meteo (1 chamada para clima atual + previsão horária)
    // ------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private Forecast fetchForecast(Double lat, Double lng) {
        try {
            String url = String.format(Locale.US, FORECAST_URL, lat, lng);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) return null;

            Map<String, Object> current = (Map<String, Object>) response.get("current");
            Map<String, Object> hourly = (Map<String, Object>) response.get("hourly");
            if (current == null || hourly == null) return null;

            CurrentWeatherDTO currentWeather = new CurrentWeatherDTO(
                    asDouble(current.get("temperature_2m")),
                    asDouble(current.get("precipitation")),
                    asInt(current.get("weathercode")),
                    asDouble(current.get("windspeed_10m")));

            return new Forecast(
                    currentWeather,
                    (List<String>) hourly.get("time"),
                    asDoubleList(hourly.get("precipitation")),
                    asDoubleList(hourly.get("temperature_2m")),
                    asDoubleList(hourly.get("windspeed_10m")),
                    String.valueOf(current.get("time")));
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------------------------------------------
    // Mapeamento e utilitários
    // ------------------------------------------------------------------

    public WeatherAlertDTO toDto(WeatherAlert alert) {
        Point center = alert.getCenterLocation();
        WeatherAlertDTO dto = new WeatherAlertDTO();
        dto.setId(alert.getId());
        dto.setTitle(alert.getTitle());
        dto.setDescription(alert.getDescription());
        dto.setSeverity(alert.getSeverity().name());
        dto.setSource(alert.getSource());
        dto.setScope(alert.getScope() != null ? alert.getScope().name() : null);
        dto.setCity(alert.getCity());
        dto.setCreatedByName(alert.getCreatedByName());
        dto.setCustom(alert.getCreatedByName() != null);
        dto.setLat(center != null ? center.getY() : null);
        dto.setLng(center != null ? center.getX() : null);
        dto.setRadiusMeters(alert.getRadiusMeters());
        dto.setExpiresAt(alert.getExpiresAt());
        dto.setCreatedAt(alert.getCreatedAt());
        return dto;
    }

    private record Rule(String id, AlertSeverity severity, String title,
                        String description, Double radiusMeters, Duration validFor) {
    }

    private record Forecast(CurrentWeatherDTO current, List<String> times,
                            List<Double> precipitation, List<Double> temperatures,
                            List<Double> windSpeeds, String currentTime) {
    }

    private List<Double> asDoubleList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().map(v -> v == null ? 0.0 : Double.parseDouble(v.toString())).toList();
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        return Double.valueOf(value.toString());
    }

    private Integer asInt(Object value) {
        if (value == null) return null;
        return Integer.valueOf(value.toString());
    }

    private double max(List<Double> values, int from, int to) {
        return values.subList(from, to).stream().mapToDouble(Double::doubleValue).max().orElse(0);
    }

    private double min(List<Double> values, int from, int to) {
        return values.subList(from, to).stream().mapToDouble(Double::doubleValue).min().orElse(0);
    }

    private double sum(List<Double> values, int from, int to) {
        return values.subList(from, to).stream().mapToDouble(Double::doubleValue).sum();
    }
}
