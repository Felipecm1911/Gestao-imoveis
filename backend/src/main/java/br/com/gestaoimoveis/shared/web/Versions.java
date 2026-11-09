package br.com.gestaoimoveis.shared.web;

import org.springframework.dao.OptimisticLockingFailureException;

/** Edição só vale sobre a versão que o usuário viu; senão 409 em vez de sobrescrever a alteração de outra pessoa. */
public final class Versions {

    private Versions() {}

    public static void check(Long current, Long sent) {
        if (sent == null || !sent.equals(current)) {
            throw new OptimisticLockingFailureException("versão desatualizada");
        }
    }
}
