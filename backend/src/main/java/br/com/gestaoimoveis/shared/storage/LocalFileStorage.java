package br.com.gestaoimoveis.shared.storage;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
class LocalFileStorage implements FileStorage {

    private final Path root;

    // String, não Path: a conversão do Spring para Path segue regras de "resource" e rejeita "../x"
    LocalFileStorage(@Value("${app.upload-dir}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    @Override
    public void save(String key, InputStream content) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public Resource load(String key) {
        return new PathResource(resolve(key));
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            throw new IllegalArgumentException("Chave de arquivo inválida");
        }
        return p;
    }
}
