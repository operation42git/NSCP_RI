package eu.efti.platformgatesimulator.repository;

import eu.efti.platformgatesimulator.entity.ConsignmentXml;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing ConsignmentXml entities.
 */
@Repository
public interface ConsignmentXmlRepository extends JpaRepository<ConsignmentXml, String> {
    
    Optional<ConsignmentXml> findByDatasetId(String datasetId);
    
    boolean existsByDatasetId(String datasetId);
}




