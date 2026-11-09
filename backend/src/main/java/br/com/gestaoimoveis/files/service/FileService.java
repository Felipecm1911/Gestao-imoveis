package br.com.gestaoimoveis.files.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import br.com.gestaoimoveis.files.domain.StoredFile;
import br.com.gestaoimoveis.files.repository.StoredFileRepository;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.storage.FileStorage;
import br.com.gestaoimoveis.shared.storage.FileType;

@Service
public class FileService {

    static final long MAX_IMAGE = 5L * 1024 * 1024;
    static final long MAX_PDF = 10L * 1024 * 1024;

    public record Download(StoredFile file, Resource content) {}

    private final StoredFileRepository repository;
    private final FileStorage storage;

    FileService(StoredFileRepository repository, FileStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    /** Grava uma imagem (JPEG, PNG ou WebP). Se a transação falhar, o arquivo em disco é apagado. */
    @Transactional(propagation = Propagation.MANDATORY)
    public StoredFile storeImage(MultipartFile upload) {
        FileType type = detect(upload);
        if (!type.image) {
            throw BusinessException.badRequest("Envie uma imagem JPEG, PNG ou WebP.");
        }
        if (upload.getSize() > MAX_IMAGE) {
            throw BusinessException.badRequest("Imagem maior que 5 MB.");
        }
        StoredFile file = new StoredFile(CurrentUser.get().organizationId(), safeName(upload.getOriginalFilename()),
                type.contentType, upload.getSize());
        try (InputStream in = upload.getInputStream()) {
            storage.save(file.getStorageKey(), in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        afterCompletion(file.getStorageKey(), TransactionSynchronization.STATUS_ROLLED_BACK);
        return repository.save(file);
    }

    /** Remove o registro; o arquivo em disco só sai depois do commit. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void delete(UUID fileId) {
        repository.findByIdAndOrganizationId(fileId, CurrentUser.get().organizationId()).ifPresent(f -> {
            repository.delete(f);
            afterCompletion(f.getStorageKey(), TransactionSynchronization.STATUS_COMMITTED);
        });
    }

    @Transactional(readOnly = true)
    public Download download(UUID id) {
        StoredFile file = repository.findByIdAndOrganizationId(id, CurrentUser.get().organizationId())
                .orElseThrow(() -> new NotFoundException("Arquivo"));
        return new Download(file, storage.load(file.getStorageKey()));
    }

    private void afterCompletion(String key, int statusThatDeletes) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == statusThatDeletes) {
                    storage.delete(key);
                }
            }
        });
    }

    private static FileType detect(MultipartFile upload) {
        if (upload.isEmpty()) {
            throw BusinessException.badRequest("Arquivo vazio.");
        }
        try (InputStream in = upload.getInputStream()) {
            return FileType.detect(in.readNBytes(12))
                    .orElseThrow(() -> BusinessException.badRequest("Tipo de arquivo não suportado."));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String safeName(String name) {
        if (name == null || name.isBlank()) return "arquivo";
        String base = name.replaceAll("[\\\\/]", "_").replaceAll("\\p{Cntrl}", "");
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }
}
