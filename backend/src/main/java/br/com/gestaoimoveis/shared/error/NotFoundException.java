package br.com.gestaoimoveis.shared.error;

/** Recurso inexistente ou de outra organização: os dois casos respondem 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String what) {
        super(what + " não encontrado");
    }
}
