package br.com.gestaoimoveis.shared.web;

/** Padrão "contém" para LIKE com '\' como escape: % e _ digitados viram texto, não curinga. */
public final class Like {

    private Like() {}

    public static String contains(String term) {
        String t = term == null ? "" : term.trim().toLowerCase();
        return "%" + t.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
