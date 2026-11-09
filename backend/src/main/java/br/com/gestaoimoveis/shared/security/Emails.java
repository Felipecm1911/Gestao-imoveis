package br.com.gestaoimoveis.shared.security;

import java.util.Locale;

/** Forma única de e-mail para gravar, buscar e contar tentativas (evita contornar o limite com variações). */
public final class Emails {

    private Emails() {}

    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
