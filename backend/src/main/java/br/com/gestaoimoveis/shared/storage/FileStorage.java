package br.com.gestaoimoveis.shared.storage;

import java.io.InputStream;

import org.springframework.core.io.Resource;

/** Onde os bytes dos arquivos ficam. Hoje é disco local; trocar por S3 não mexe nos módulos. */
public interface FileStorage {

    void save(String key, InputStream content);

    Resource load(String key);

    void delete(String key);
}
