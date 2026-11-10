package com.zelo.backend.exception;

/**
 * Exceção lançada quando uma entidade solicitada não existe.
 */
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }
}
