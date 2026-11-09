package br.com.gestaoimoveis.shared.storage;

import java.util.Optional;

/** Tipo detectado pelos bytes iniciais, nunca pela extensão ou pelo Content-Type enviado. */
public enum FileType {
    JPEG("image/jpeg", true),
    PNG("image/png", true),
    WEBP("image/webp", true),
    PDF("application/pdf", false);

    public final String contentType;
    public final boolean image;

    FileType(String contentType, boolean image) {
        this.contentType = contentType;
        this.image = image;
    }

    public static Optional<FileType> detect(byte[] h) {
        if (at(h, 0, 0xFF, 0xD8, 0xFF)) return Optional.of(JPEG);
        if (at(h, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return Optional.of(PNG);
        if (at(h, 0, 0x52, 0x49, 0x46, 0x46) && at(h, 8, 0x57, 0x45, 0x42, 0x50)) return Optional.of(WEBP); // RIFF....WEBP
        if (at(h, 0, 0x25, 0x50, 0x44, 0x46, 0x2D)) return Optional.of(PDF); // %PDF-
        return Optional.empty();
    }

    private static boolean at(byte[] h, int offset, int... sig) {
        if (h.length < offset + sig.length) return false;
        for (int i = 0; i < sig.length; i++) {
            if ((h[offset + i] & 0xFF) != sig[i]) return false;
        }
        return true;
    }
}
