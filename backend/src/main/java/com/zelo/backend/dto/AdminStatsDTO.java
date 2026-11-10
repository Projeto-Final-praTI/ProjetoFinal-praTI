package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;

/** Visão global do painel root: contagens e cidades cadastradas. */
@Schema(description = "Indicadores agregados do sistema (visão global do ROOT).")
public class AdminStatsDTO {

    @Schema(description = "Total de contas cadastradas.", example = "128")
    private long totalUsers;

    @Schema(description = "Total de pontos críticos registrados.", example = "417")
    private long totalIncidents;

    @Schema(description = "Quantidade de usuários por papel.", example = "{\"USER\": 100, \"FISCAL\": 20, \"GESTOR\": 6, \"ROOT\": 2}")
    private Map<String, Long> usersByRole;

    @Schema(description = "Quantidade de pontos críticos por status.", example = "{\"ABERTO\": 300, \"EM_ATENDIMENTO\": 80, \"RESOLVIDO\": 37}")
    private Map<String, Long> incidentsByStatus;

    @Schema(description = "Cidades cadastradas (área de atuação dos gestores/fiscais).",
            example = "[\"São Paulo\", \"Rio de Janeiro\"]")
    private List<String> cities;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalIncidents() { return totalIncidents; }
    public void setTotalIncidents(long totalIncidents) { this.totalIncidents = totalIncidents; }

    public Map<String, Long> getUsersByRole() { return usersByRole; }
    public void setUsersByRole(Map<String, Long> usersByRole) { this.usersByRole = usersByRole; }

    public Map<String, Long> getIncidentsByStatus() { return incidentsByStatus; }
    public void setIncidentsByStatus(Map<String, Long> incidentsByStatus) { this.incidentsByStatus = incidentsByStatus; }

    public List<String> getCities() { return cities; }
    public void setCities(List<String> cities) { this.cities = cities; }
}
