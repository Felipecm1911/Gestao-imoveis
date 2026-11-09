package br.com.gestaoimoveis.properties.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyListItem;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyRequest;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyResponse;
import br.com.gestaoimoveis.properties.api.PropertyDtos.StatusRequest;
import br.com.gestaoimoveis.properties.domain.Property;
import br.com.gestaoimoveis.properties.repository.PropertyRepository;
import br.com.gestaoimoveis.properties.service.PropertyService;
import br.com.gestaoimoveis.shared.web.PageResponse;

@RestController
@RequestMapping("/api/properties")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
class PropertyController {

    private final PropertyService service;

    PropertyController(PropertyService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<PropertyListItem> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Property.Type type,
            @RequestParam(required = false) Property.Status status,
            @RequestParam(required = false) BigDecimal minRent,
            @RequestParam(required = false) BigDecimal maxRent,
            @RequestParam(required = false) UUID ownerId,
            @PageableDefault(size = 12, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.search(new PropertyRepository.Filter(q, city, type, status, minRent, maxRent, ownerId), pageable);
    }

    @GetMapping("/{id}")
    PropertyResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PropertyResponse create(@Valid @RequestBody PropertyRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    PropertyResponse update(@PathVariable UUID id, @Valid @RequestBody PropertyRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/status")
    PropertyResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest req) {
        return service.changeStatus(id, req.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PostMapping(path = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    PropertyResponse addPhotos(@PathVariable UUID id, @RequestPart("files") List<MultipartFile> files) {
        return service.addPhotos(id, files);
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    PropertyResponse deletePhoto(@PathVariable UUID id, @PathVariable UUID photoId) {
        return service.deletePhoto(id, photoId);
    }

    @PutMapping("/{id}/photos/{photoId}/cover")
    PropertyResponse setCover(@PathVariable UUID id, @PathVariable UUID photoId) {
        return service.setCover(id, photoId);
    }
}
