package com.zelo.backend.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Armazenamento local das imagens enviadas pela API.
 *
 * <p>As imagens ficam sob {@code storage.local-path} e são servidas
 * publicamente em {@code /uploads/**} por {@code WebConfig}. As URLs
 * retornadas são relativas por padrão, para funcionar atrás de proxy,
 * Docker e túnel sem depender do domínio de acesso.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    @Value("${storage.local-path:./uploads}")
    private String localPath;

    /**
     * Base pública opcional para as URLs das imagens (ex.: https://zelo.apps.log.br).
     * Vazio (padrão) = URLs relativas (/uploads/...), que funcionam em qualquer
     * host/domínio — necessário para Docker + Cloudflare Tunnel.
     */
    @Value("${app.public-base-url:}")
    private String publicBaseUrl;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(localPath));
            Files.createDirectories(Paths.get(localPath, "incidents"));
            Files.createDirectories(Paths.get(localPath, "missing-persons"));
            log.info("Armazenamento local inicializado em: {}", new File(localPath).getAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao inicializar armazenamento local", e);
        }
    }

    public String uploadImage(String incidentId, MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path incidentDir = Paths.get(localPath, "incidents", incidentId);
        Files.createDirectories(incidentDir);
        Path targetFile = incidentDir.resolve(fileName);
        try (InputStream inputStream = file.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(targetFile.toFile())) {
            inputStream.transferTo(outputStream);
        }
        // URL relativa por padrão: funciona atrás de nginx/tunnel/domínio externo
        String base = (publicBaseUrl == null || publicBaseUrl.isBlank())
                ? ""
                : publicBaseUrl.replaceAll("/$", "");
        return base + "/uploads/incidents/" + incidentId + "/" + fileName;
    }

    /**
     * Upload da foto de uma denúncia de pessoa desaparecida. Fica em uma pasta
     * própria para não se misturar às evidências de pontos críticos.
     */
    public String uploadMissingPersonPhoto(String reportId, MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path reportDir = Paths.get(localPath, "missing-persons", reportId);
        Files.createDirectories(reportDir);
        Path targetFile = reportDir.resolve(fileName);
        try (InputStream inputStream = file.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(targetFile.toFile())) {
            inputStream.transferTo(outputStream);
        }
        String base = (publicBaseUrl == null || publicBaseUrl.isBlank())
                ? ""
                : publicBaseUrl.replaceAll("/$", "");
        return base + "/uploads/missing-persons/" + reportId + "/" + fileName;
    }

    /**
     * Imagem anexada a um comentário/avistamento de denúncia. Fica na subpasta
     * {@code comments} da denúncia para não se misturar à foto principal.
     */
    public String uploadMissingPersonCommentImage(String reportId, MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path commentDir = Paths.get(localPath, "missing-persons", reportId, "comments");
        Files.createDirectories(commentDir);
        Path targetFile = commentDir.resolve(fileName);
        try (InputStream inputStream = file.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(targetFile.toFile())) {
            inputStream.transferTo(outputStream);
        }
        String base = (publicBaseUrl == null || publicBaseUrl.isBlank())
                ? ""
                : publicBaseUrl.replaceAll("/$", "");
        return base + "/uploads/missing-persons/" + reportId + "/comments/" + fileName;
    }

    private String sanitize(String fileName) {
        if (fileName == null) {
            return "file";
        }
        return fileName.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
    }
}
