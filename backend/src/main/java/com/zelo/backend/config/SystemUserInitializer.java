package com.zelo.backend.config;

import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.repository.UserRepository;
import com.zelo.backend.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Garante a existência da conta técnica {@link AdminService#SYSTEM_OWNER_EMAIL}.
 *
 * Ela NÃO é um usuário real: assume a autoria dos pontos críticos quando um
 * usuário é excluído com a opção "manter pontos" (a FK incidents.author_id é
 * NOT NULL, então não dá para simplesmente anular o autor).
 *
 * A conta não possui senha utilizável (passwordHash = null), portanto não é
 * possível autenticar com ela.
 */
@Component
public class SystemUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SystemUserInitializer.class);

    private final UserRepository userRepository;

    public SystemUserInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByEmail(AdminService.SYSTEM_OWNER_EMAIL).isPresent()) {
            return;
        }
        User system = User.builder()
                .fullName("Usuário removido")
                .email(AdminService.SYSTEM_OWNER_EMAIL)
                // CPF fictício e único (a coluna é NOT NULL + UNIQUE). Não é um CPF real.
                .cpf("00000000000")
                .passwordHash(null) // sem senha => não autentica
                .role(Role.USER)
                .city(null)
                .build();
        try {
            userRepository.save(system);
            log.info("Conta técnica de sistema criada: {}", AdminService.SYSTEM_OWNER_EMAIL);
        } catch (Exception e) {
            // Conflito de CPF/unique (ex.: banco já tem outro registro): não bloqueia o boot.
            log.warn("Não foi possível criar a conta técnica de sistema: {}", e.getMessage());
        }
    }
}
