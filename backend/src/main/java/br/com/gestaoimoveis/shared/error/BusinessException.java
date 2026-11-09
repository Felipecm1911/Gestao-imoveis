package br.com.gestaoimoveis.shared.error;

import org.springframework.http.HttpStatus;

/** Regra de negócio violada; a mensagem vai para o usuário. */
public class BusinessException extends RuntimeException {
    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(HttpStatus.CONFLICT, message);
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, message);
    }

    public HttpStatus status() {
        return status;
    }
}
