package br.com.gestaoimoveis.properties.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.com.gestaoimoveis.files.service.FileService;
import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerSummary;
import br.com.gestaoimoveis.owners.service.OwnerService;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PhotoResponse;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyListItem;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyRequest;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyResponse;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertySummary;
import br.com.gestaoimoveis.properties.domain.Property;
import br.com.gestaoimoveis.properties.domain.PropertyPhoto;
import br.com.gestaoimoveis.properties.repository.PropertyPhotoRepository;
import br.com.gestaoimoveis.properties.repository.PropertyRepository;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.money.Money;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.web.PageResponse;
import br.com.gestaoimoveis.shared.web.Versions;

@Service
public class PropertyService {

    static final int MAX_PHOTOS = 20;

    private final PropertyRepository properties;
    private final PropertyPhotoRepository photos;
    private final OwnerService owners;
    private final FileService files;

    PropertyService(PropertyRepository properties, PropertyPhotoRepository photos, OwnerService owners,
            FileService files) {
        this.properties = properties;
        this.photos = photos;
        this.owners = owners;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public PageResponse<PropertyListItem> search(PropertyRepository.Filter filter, Pageable pageable) {
        Page<Property> page = properties.findAll(PropertyRepository.matching(org(), filter), pageable);
        List<UUID> ids = page.map(Property::getId).getContent();
        Map<UUID, String> ownerNames = owners.namesById(page.map(Property::getOwnerId).toSet());
        Map<UUID, UUID> covers = photos.findByPropertyIdInAndCoverTrue(ids).stream()
                .collect(Collectors.toMap(PropertyPhoto::getPropertyId, PropertyPhoto::getFileId));
        return PageResponse.of(page, p -> PropertyListItem.of(p,
                new OwnerSummary(p.getOwnerId(), ownerNames.get(p.getOwnerId())),
                covers.containsKey(p.getId()) ? fileUrl(covers.get(p.getId())) : null));
    }

    @Transactional(readOnly = true)
    public PropertyResponse get(UUID id) {
        return toResponse(load(id));
    }

    @Transactional
    public PropertyResponse create(PropertyRequest req) {
        Property p = new Property(org());
        p.update(data(req));
        return toResponse(save(p));
    }

    @Transactional
    public PropertyResponse update(UUID id, PropertyRequest req) {
        Property p = load(id);
        Versions.check(p.getVersion(), req.version());
        p.update(data(req));
        return toResponse(save(p));
    }

    @Transactional
    public PropertyResponse changeStatus(UUID id, Property.Status status) {
        Property p = load(id);
        try {
            p.changeStatus(status);
        } catch (IllegalArgumentException e) {
            throw BusinessException.conflict(e.getMessage());
        }
        return toResponse(p);
    }

    /** Usado pelos contratos: código e título dos imóveis de uma página. */
    @Transactional(readOnly = true)
    public Map<UUID, PropertySummary> summariesById(Collection<UUID> ids) {
        return properties.findAllById(ids).stream()
                .collect(Collectors.toMap(Property::getId, p -> new PropertySummary(p.getId(), p.getCode(), p.getTitle())));
    }

    /** Usado pelos contratos na ativação. A trava da linha põe em fila ativações simultâneas no mesmo imóvel. */
    @Transactional
    public void occupy(UUID id) {
        try {
            loadForUpdate(id).occupy();
        } catch (IllegalArgumentException e) {
            throw BusinessException.conflict(e.getMessage());
        }
    }

    /** Usado pelos contratos quando o imóvel fica sem contrato ativo. */
    @Transactional
    public void release(UUID id) {
        loadForUpdate(id).release();
    }

    @Transactional
    public void delete(UUID id) {
        Property p = load(id);
        List<PropertyPhoto> gallery = photos.findByPropertyIdOrderByPosition(id);
        photos.deleteAll(gallery);
        properties.delete(p);
        try {
            photos.flush();
        } catch (DataIntegrityViolationException e) {
            // a FK do contrato segura o imóvel: com contrato (ativo ou histórico) ele não some
            throw BusinessException.conflict("Este imóvel tem contratos e não pode ser excluído.");
        }
        gallery.forEach(photo -> files.delete(photo.getFileId()));
    }

    @Transactional
    public PropertyResponse addPhotos(UUID id, List<MultipartFile> uploads) {
        Property p = loadForUpdate(id);
        List<PropertyPhoto> gallery = photos.findByPropertyIdOrderByPosition(id);
        if (uploads == null || uploads.isEmpty()) {
            throw BusinessException.badRequest("Selecione ao menos uma foto.");
        }
        if (gallery.size() + uploads.size() > MAX_PHOTOS) {
            throw BusinessException.badRequest("Cada imóvel aceita até " + MAX_PHOTOS + " fotos.");
        }
        int next = gallery.isEmpty() ? 0 : gallery.getLast().getPosition() + 1;
        boolean needsCover = gallery.stream().noneMatch(PropertyPhoto::isCover);
        for (MultipartFile upload : uploads) {
            var file = files.storeImage(upload);
            photos.save(new PropertyPhoto(org(), p.getId(), file.getId(), next++, needsCover));
            needsCover = false;
        }
        photos.flush(); // FK do stored_file precisa existir antes; o flush ordena as inserções
        return toResponse(p);
    }

    @Transactional
    public PropertyResponse deletePhoto(UUID id, UUID photoId) {
        Property p = loadForUpdate(id);
        List<PropertyPhoto> gallery = photos.findByPropertyIdOrderByPosition(id);
        PropertyPhoto photo = find(gallery, photoId);
        photos.delete(photo);
        photos.flush();
        if (photo.isCover()) {
            gallery.stream().filter(x -> x != photo).findFirst().ifPresent(x -> x.setCover(true));
        }
        files.delete(photo.getFileId());
        return toResponse(p);
    }

    @Transactional
    public PropertyResponse setCover(UUID id, UUID photoId) {
        Property p = loadForUpdate(id);
        List<PropertyPhoto> gallery = photos.findByPropertyIdOrderByPosition(id);
        PropertyPhoto chosen = find(gallery, photoId);
        // tira a capa antiga antes de marcar a nova: o índice único parcial não aceita duas capas
        gallery.stream().filter(PropertyPhoto::isCover).forEach(x -> x.setCover(false));
        photos.flush();
        chosen.setCover(true);
        return toResponse(p);
    }

    private PropertyResponse toResponse(Property p) {
        OwnerSummary owner = owners.summary(p.getOwnerId());
        List<PhotoResponse> gallery = photos.findByPropertyIdOrderByPosition(p.getId()).stream()
                .map(x -> new PhotoResponse(x.getId(), fileUrl(x.getFileId()), x.getPosition(), x.isCover()))
                .toList();
        return PropertyResponse.of(p, owner, gallery);
    }

    private Property.Data data(PropertyRequest r) {
        owners.summary(r.ownerId()); // 404 se o proprietário não for desta organização
        return new Property.Data(r.ownerId(), r.code().trim().toUpperCase(), r.title().trim(), blankToNull(r.description()),
                r.type(), r.street().trim(), r.number().trim(), blankToNull(r.complement()), r.district().trim(),
                r.city().trim(), r.state(), r.zip(), Money.of(r.areaM2()), r.bedrooms(), r.bathrooms(), r.parking(),
                Money.of(r.suggestedRent()));
    }

    private Property save(Property p) {
        try {
            return properties.saveAndFlush(p);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Já existe um imóvel com este código.");
        }
    }

    private Property load(UUID id) {
        return properties.findByIdAndOrganizationId(id, org()).orElseThrow(() -> new NotFoundException("Imóvel"));
    }

    private Property loadForUpdate(UUID id) {
        return properties.findForUpdate(id, org()).orElseThrow(() -> new NotFoundException("Imóvel"));
    }

    private static PropertyPhoto find(List<PropertyPhoto> gallery, UUID photoId) {
        return gallery.stream().filter(x -> x.getId().equals(photoId)).findFirst()
                .orElseThrow(() -> new NotFoundException("Foto"));
    }

    private static String fileUrl(UUID fileId) {
        return "/api/files/" + fileId;
    }

    private static UUID org() {
        return CurrentUser.get().organizationId();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
