package com.zelo.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Geocodificação (cidade ↔ coordenada) via Nominatim/OpenStreetMap.
 *
 * <p>Usada para (a) preencher a cidade de um ponto crítico a partir do GPS e
 * (b) transformar "cidade inteira" no centro do município ao disparar um alerta
 * local. É "best effort": qualquer falha resulta em {@code null}.
 *
 * <p>O Nominatim aplica limite de ~1 requisição por segundo por IP. Como o
 * fluxo de alertas pode geocodificar duas cidades em sequência, as chamadas são
 * serializadas com um intervalo mínimo e repetidas uma vez em caso de falha —
 * sem isso a segunda cidade cai no fallback e o alerta sai no lugar errado.
 */
@Service
public class ReverseGeocodingService {

    private static final Logger log = LoggerFactory.getLogger(ReverseGeocodingService.class);

    /** Intervalo mínimo entre chamadas ao Nominatim (política de uso: 1 req/s). */
    private static final long MIN_INTERVAL_MS = 1100L;

    /** Tipos de resultado aceitos como "centro de município", do melhor ao pior. */
    private static final List<String> CITY_ADDRESS_TYPES =
            List.of("municipality", "city", "town", "administrative", "village", "county");

    private final RestTemplate restTemplate;
    private final String baseUrl;

    /**
     * Cache do centro dos municípios já resolvidos. O centro de uma cidade não
     * muda, então guardar evita consultas repetidas a cada alerta criado.
     */
    private final Map<String, double[]> cityCenterCache = new ConcurrentHashMap<>();

    /** Momento (nanoTime) da última chamada ao Nominatim, para o throttle. */
    private long lastRequestNanos = 0L;

    public ReverseGeocodingService(RestTemplate restTemplate,
                                   @Value("${app.geocoding.base-url:https://nominatim.openstreetmap.org}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    /**
     * Resolve o município para uma coordenada.
     *
     * @return nome do município ou {@code null} se não for possível determinar.
     */
    @SuppressWarnings("unchecked")
    public String resolveCity(double lat, double lng) {
        try {
            String url = String.format(
                    "%s/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=pt-BR&lat=%s&lon=%s",
                    baseUrl,
                    URLEncoder.encode(String.valueOf(lat), StandardCharsets.UTF_8),
                    URLEncoder.encode(String.valueOf(lng), StandardCharsets.UTF_8));

            Map<String, Object> body = getJson(url, Map.class);
            if (body == null) return null;

            Object addressObj = body.get("address");
            if (!(addressObj instanceof Map)) return null;
            Map<String, Object> address = (Map<String, Object>) addressObj;

            // Ordem de preferência: município → cidade → vila → distrito
            for (String key : new String[]{"city", "town", "municipality", "village", "city_district", "county"}) {
                Object value = address.get(key);
                if (value != null && !value.toString().isBlank()) {
                    return value.toString().trim();
                }
            }
            return null;
        } catch (Exception e) {
            // Falha de rede/timeout/parse: segue sem cidade (não bloqueia o registro)
            log.warn("Geocodificação reversa falhou para {},{}: {}", lat, lng, e.toString());
            return null;
        }
    }

    /**
     * Resolve o centro aproximado de um município (cidade → lat/lng).
     *
     * <p>Busca até 5 resultados e prefere o que realmente é o município (e não
     * um bairro homônimo em outro estado). O resultado é cacheado; falha de
     * rede/parse resulta em {@code null}.
     *
     * @return {@code [lat, lng]} ou {@code null} se não for possível localizar.
     */
    @SuppressWarnings("unchecked")
    public double[] resolveCityCenter(String city) {
        if (city == null || city.isBlank()) return null;
        String key = city.trim().toLowerCase(Locale.ROOT);
        double[] cached = cityCenterCache.get(key);
        if (cached != null) return cached;

        String url = String.format(
                "%s/search?format=jsonv2&limit=5&countrycodes=br&accept-language=pt-BR&q=%s",
                baseUrl,
                URLEncoder.encode(city.trim() + ", Brasil", StandardCharsets.UTF_8));

        // Duas tentativas: a primeira pode esbarrar no rate limit do Nominatim.
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                List<?> body = getJson(url, List.class);
                if (body == null || body.isEmpty()) {
                    log.warn("Nominatim não encontrou a cidade '{}'", city);
                    return null;
                }
                double[] center = pickCityCenter(body, city);
                if (center == null) {
                    log.warn("Nominatim não retornou coordenadas para a cidade '{}'", city);
                    return null;
                }
                cityCenterCache.put(key, center);
                return center;
            } catch (Exception e) {
                log.warn("Falha ao geocodificar '{}' (tentativa {}/2): {}", city, attempt, e.toString());
                if (attempt == 2) return null;
            }
        }
        return null;
    }

    /**
     * Escolhe o resultado que melhor representa o município: prioriza nome
     * exato e tipos administrativos, evitando bairros homônimos.
     */
    @SuppressWarnings("unchecked")
    private double[] pickCityCenter(List<?> results, String city) {
        Map<String, Object> best = null;
        int bestScore = Integer.MIN_VALUE;

        for (Object item : results) {
            if (!(item instanceof Map)) continue;
            Map<String, Object> place = (Map<String, Object>) item;
            int score = scorePlace(place, city);
            if (score > bestScore) {
                bestScore = score;
                best = place;
            }
        }
        if (best == null) return null;

        try {
            double lat = Double.parseDouble(String.valueOf(best.get("lat")));
            double lon = Double.parseDouble(String.valueOf(best.get("lon")));
            return new double[]{lat, lon};
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private int scorePlace(Map<String, Object> place, String city) {
        int score = 0;

        Object name = place.get("name");
        if (name != null && name.toString().equalsIgnoreCase(city.trim())) score += 100;

        Object type = place.get("addresstype");
        String addressType = type != null ? type.toString() : "";
        int typeRank = CITY_ADDRESS_TYPES.indexOf(addressType);
        if (typeRank >= 0) {
            // municipality/city/town valem mais que county/administrative
            score += 60 - typeRank * 8;
        }

        if ("boundary".equals(String.valueOf(place.get("category")))) score += 20;

        Object rank = place.get("place_rank");
        if (rank instanceof Number n && n.intValue() >= 14) score += 10;

        return score;
    }

    /**
     * GET JSON com throttle global (Nominatim: máx. ~1 req/s) e User-Agent
     * identificando a aplicação, exigido pela política de uso.
     *
     * <p>A URL é convertida para {@link URI} antes da chamada: passando uma
     * {@code String}, o {@code RestTemplate} a trata como template e codifica
     * novamente o que já está codificado (ex.: {@code %C3%A3} vira
     * {@code %25C3%25A3}), e o Nominatim não encontra a cidade.
     */
    private <T> T getJson(String url, Class<T> responseType) {
        awaitRateLimitSlot();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "ZELO-App/1.0 (zelo.apps.log.br)");
        headers.set("Accept", "application/json");

        ResponseEntity<T> response = restTemplate.exchange(
                URI.create(url), HttpMethod.GET, new HttpEntity<>(headers), responseType);
        return response.getBody();
    }

    /**
     * Serializa as chamadas para respeitar o limite do Nominatim. O
     * {@code synchronized} garante que requisições concorrentes não disparem em
     * paralelo; o intervalo é medido pelo último request efetivo.
     */
    private synchronized void awaitRateLimitSlot() {
        long now = System.nanoTime();
        long elapsedMs = (now - lastRequestNanos) / 1_000_000L;
        if (lastRequestNanos != 0L && elapsedMs < MIN_INTERVAL_MS) {
            try {
                Thread.sleep(MIN_INTERVAL_MS - elapsedMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        lastRequestNanos = System.nanoTime();
    }

    /** Exposto para testes/diagnóstico: limpa o cache de centros de cidade. */
    public void clearCache() {
        cityCenterCache.clear();
    }

    /** Cidades já resolvidas (diagnóstico). */
    public Set<String> cachedCities() {
        return Set.copyOf(cityCenterCache.keySet());
    }
}
