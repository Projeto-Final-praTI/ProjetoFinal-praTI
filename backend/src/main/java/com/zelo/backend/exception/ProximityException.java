package com.zelo.backend.exception;

/**
 * Exceção lançada quando o autor está fora do raio geográfico permitido.
 */
public class ProximityException extends RuntimeException {

    public ProximityException(String message) {
        super(message);
    }
}
