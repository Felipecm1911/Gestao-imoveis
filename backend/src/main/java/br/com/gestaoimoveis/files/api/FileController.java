package br.com.gestaoimoveis.files.api;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.gestaoimoveis.files.service.FileService;

@RestController
@RequestMapping("/api/files")
class FileController {

    private final FileService service;

    FileController(FileService service) {
        this.service = service;
    }

    // portais (OWNER/TENANT) ganham acesso por visibilidade na Fase 5
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    ResponseEntity<Resource> download(@PathVariable UUID id) {
        var d = service.download(id);
        MediaType type = MediaType.parseMediaType(d.file().getContentType());
        var disposition = type.getType().equals("image") ? ContentDisposition.inline() : ContentDisposition.attachment();
        return ResponseEntity.ok()
                .contentType(type)
                .contentLength(d.file().getSize())
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.filename(d.file().getOriginalName(),
                        java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .body(d.content());
    }
}
