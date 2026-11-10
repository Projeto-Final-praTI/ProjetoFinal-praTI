package com.zelo.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração web: exposição pública das imagens armazenadas em {@code /uploads/**}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.local-path:./uploads}")
    private String localPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // No Windows, o caminho absoluto usa barras invertidas (\\), mas URLs
        // de arquivo precisam de barras normais (/). Normaliza para garantir
        // funcionamento multiplataforma.
        String absolutePath = new java.io.File(localPath).getAbsolutePath()
                .replace("\\", "/") + "/";
        String fileLocation = "file:" + absolutePath;
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(fileLocation);
    }
}
