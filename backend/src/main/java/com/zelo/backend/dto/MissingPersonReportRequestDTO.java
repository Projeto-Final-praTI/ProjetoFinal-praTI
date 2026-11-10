package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Parte {@code data} do multipart de denúncia de pessoa desaparecida.
 * A foto é obrigatória e vai na parte {@code photo}.
 */
@Schema(description = "Dados da denúncia de pessoa desaparecida/sequestro.")
public class MissingPersonReportRequestDTO {

    @Schema(description = "Nome da pessoa desaparecida.", example = "João da Silva")
    @NotBlank(message = "Nome da pessoa é obrigatório")
    @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
    private String personName;

    @Schema(description = "Tipo da ocorrência.",
            allowableValues = {"DESAPARECIMENTO", "SEQUESTRO"}, example = "DESAPARECIMENTO")
    @NotBlank(message = "Tipo da ocorrência é obrigatório")
    private String kind;

    @Schema(description = "Descrição do que aconteceu, características da pessoa e orientações.",
            example = "Saiu de casa às 8h e não retornou. Usava camiseta azul e calça jeans.")
    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    private String description;

    @Schema(description = "Última vez que foi vista (local/data/horário).",
            example = "Vista pela última vez no Terminal Central, ontem às 18h.")
    @Size(max = 500, message = "Informação deve ter no máximo 500 caracteres")
    private String lastSeenInfo;

    @Schema(description = "Contato do denunciante (não é exibido publicamente).",
            example = "(68) 99999-9999")
    @Size(max = 200, message = "Contato deve ter no máximo 200 caracteres")
    private String contact;

    @Schema(description = "Cidade/região onde a pessoa desapareceu.", example = "Rio Branco")
    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 120, message = "Cidade deve ter no máximo 120 caracteres")
    private String city;

    @Schema(description = """
            Latitude da localização do denunciante. Quando informada junto da
            longitude, dispara o pré-alerta de 10 minutos num raio de 1 km e
            define o centro do alerta após a aprovação.""", example = "-9.97499")
    private Double lat;

    @Schema(description = "Longitude da localização do denunciante.", example = "-67.8243")
    private Double lng;

    public String getPersonName() { return personName; }
    public void setPersonName(String personName) { this.personName = personName; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLastSeenInfo() { return lastSeenInfo; }
    public void setLastSeenInfo(String lastSeenInfo) { this.lastSeenInfo = lastSeenInfo; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

}
