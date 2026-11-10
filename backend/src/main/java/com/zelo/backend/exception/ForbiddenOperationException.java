package com.zelo.backend.exception;

/** Violação de autorização RBAC (papel ou cidade) → HTTP 403. */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
