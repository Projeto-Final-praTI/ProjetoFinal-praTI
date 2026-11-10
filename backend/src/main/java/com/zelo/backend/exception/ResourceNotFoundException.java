package com.zelo.backend.exception;

/**
 * Exceção lançada quando um recurso de autenticação ou usuário não é encontrado.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
