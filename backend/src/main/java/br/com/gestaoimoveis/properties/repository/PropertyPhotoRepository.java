package br.com.gestaoimoveis.properties.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.properties.domain.PropertyPhoto;

public interface PropertyPhotoRepository extends JpaRepository<PropertyPhoto, UUID> {

    List<PropertyPhoto> findByPropertyIdOrderByPosition(UUID propertyId);

    List<PropertyPhoto> findByPropertyIdInAndCoverTrue(Collection<UUID> propertyIds);
}
