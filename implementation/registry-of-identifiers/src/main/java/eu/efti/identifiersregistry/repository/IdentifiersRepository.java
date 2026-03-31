package eu.efti.identifiersregistry.repository;

import eu.efti.commons.dto.SearchWithIdentifiersRequestDto;
import eu.efti.identifiersregistry.entity.CarriedTransportEquipment;
import eu.efti.identifiersregistry.entity.Consignment;
import eu.efti.identifiersregistry.entity.MainCarriageTransportMovement;
import eu.efti.identifiersregistry.entity.UsedTransportEquipment;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public interface IdentifiersRepository extends JpaRepository<Consignment, Long>, JpaSpecificationExecutor<Consignment> {

    String VEHICLE_COUNTRY = "registrationCountry";
    String TRANSPORT_MODE = "modeCode";
    String IS_DANGEROUS_GOODS = "dangerousGoodsIndicator";
    String MOVEMENTS = "mainCarriageTransportMovements";
    String TRANSPORT_VEHICLES = "usedTransportEquipments";
    String VEHICLE_ID = "equipmentId";
    String EQUIPMENT = "equipment";
    String CARRIED = "carried";
    String MEANS = "means";
    String CARRIED_TRANSPORT_EQUIPMENTS = "carriedTransportEquipments";
    String USED_TRANSPORT_MEANS_REGISTRATION_COUNTRY = "usedTransportMeansRegistrationCountry";
    String USED_TRANSPORT_MEANS_ID = "usedTransportMeansId";

    @Query(value = "SELECT c FROM Consignment c where c.gateId = :gate and c.datasetId = :uuid and c.platformId = :platform")
    Optional<Consignment> findByUil(final String gate, final String uuid, final String platform);

    default List<Consignment> searchByCriteria(final SearchWithIdentifiersRequestDto request) {
        System.out.println("=== SEARCH BY CRITERIA START ===");
        System.out.println("Identifier: '" + request.getIdentifier() + "'");
        System.out.println("Identifier Types: " + request.getIdentifierType());
        
        final Set<Consignment> results = new HashSet<>();
        List<String> identifierTypes = request.getIdentifierType();
        if (CollectionUtils.isNotEmpty(identifierTypes)) {
            identifierTypes.forEach(identifierType -> {
                System.out.println("Searching for type: " + identifierType);
                if (MEANS.equalsIgnoreCase(identifierType)) {
                    List<Consignment> meansResults = findAllForMeans(request);
                    System.out.println("MEANS results: " + meansResults.size());
                    results.addAll(meansResults);
                } else if (EQUIPMENT.equalsIgnoreCase(identifierType)) {
                    List<Consignment> equipmentResults = findAllForEquipment(request);
                    System.out.println("EQUIPMENT results: " + equipmentResults.size());
                    results.addAll(equipmentResults);
                } else if (CARRIED.equalsIgnoreCase(identifierType)) {
                    List<Consignment> carriedResults = findAllForCarried(request);
                    System.out.println("CARRIED results: " + carriedResults.size());
                    results.addAll(carriedResults);
                }
            });
        } else {
            System.out.println("No identifier types specified, searching all types");
            List<Consignment> meansResults = findAllForMeans(request);
            List<Consignment> equipmentResults = findAllForEquipment(request);
            List<Consignment> carriedResults = findAllForCarried(request);
            System.out.println("MEANS results: " + meansResults.size());
            System.out.println("EQUIPMENT results: " + equipmentResults.size());
            System.out.println("CARRIED results: " + carriedResults.size());
            results.addAll(Stream.of(meansResults, equipmentResults, carriedResults)
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet()));
        }
        System.out.println("Total unique results: " + results.size());
        System.out.println("=== SEARCH BY CRITERIA END ===");
        return new ArrayList<>(results);
    }

    default List<Consignment> findAllForMeans(SearchWithIdentifiersRequestDto request) {
        return this.findAll((root, query, cb) -> {
            final List<Predicate> predicates = new ArrayList<>();
            Join<Consignment, MainCarriageTransportMovement> mainCarriageTransportMovementJoin = root.join(MOVEMENTS, JoinType.LEFT);

            // Normalize identifier by removing dashes and non-alphanumeric characters for comparison
            String normalizedSearchId = request.getIdentifier().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
            Expression<String> normalizedDbId = cb.function("REPLACE", String.class,
                    cb.upper(mainCarriageTransportMovementJoin.get(USED_TRANSPORT_MEANS_ID)),
                    cb.literal("-"),
                    cb.literal(""));
            // Remove any remaining non-alphanumeric characters
            normalizedDbId = cb.function("REPLACE", String.class, normalizedDbId, cb.literal(" "), cb.literal(""));
            predicates.add(cb.equal(normalizedDbId, normalizedSearchId));

            buildCommonAttributesRequest(request, cb, predicates, mainCarriageTransportMovementJoin);

            if (StringUtils.isNotBlank(request.getRegistrationCountryCode())) {
                predicates.add(cb.equal(mainCarriageTransportMovementJoin.get(USED_TRANSPORT_MEANS_REGISTRATION_COUNTRY), request.getRegistrationCountryCode()));
            }

            return cb.and(predicates.toArray(new Predicate[]{}));
        });
    }

    default List<Consignment> findAllForEquipment(SearchWithIdentifiersRequestDto request) {
        return this.findAll((root, query, cb) -> {
            final List<Predicate> predicates = new ArrayList<>();
            Join<Consignment, MainCarriageTransportMovement> mainCarriageTransportMovementJoin = root.join(MOVEMENTS, JoinType.LEFT);
            Join<Consignment, UsedTransportEquipment> equipmentJoin = root.join(TRANSPORT_VEHICLES, JoinType.LEFT);
            
            // Log the search identifier
            String originalIdentifier = request.getIdentifier();
            String normalizedSearchId = originalIdentifier.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
            System.out.println("=== EQUIPMENT SEARCH DEBUG ===");
            System.out.println("Original Identifier: '" + originalIdentifier + "'");
            System.out.println("Normalized Search ID: '" + normalizedSearchId + "'");
            System.out.println("ModeCode filter: " + request.getModeCode());
            System.out.println("RegistrationCountryCode filter: " + request.getRegistrationCountryCode());
            System.out.println("DangerousGoodsIndicator filter: " + request.getDangerousGoodsIndicator());
            
            // Normalize identifier by removing dashes and non-alphanumeric characters for comparison
            Expression<String> normalizedDbId = cb.function("REPLACE", String.class,
                    cb.upper(equipmentJoin.get(VEHICLE_ID)),
                    cb.literal("-"),
                    cb.literal(""));
            // Remove any remaining non-alphanumeric characters (spaces, etc.)
            normalizedDbId = cb.function("REPLACE", String.class, normalizedDbId, cb.literal(" "), cb.literal(""));
            predicates.add(cb.equal(normalizedDbId, normalizedSearchId));

            buildCommonAttributesRequest(request, cb, predicates, mainCarriageTransportMovementJoin);

            if (StringUtils.isNotBlank(request.getRegistrationCountryCode())) {
                predicates.add(cb.equal(equipmentJoin.get(VEHICLE_COUNTRY), request.getRegistrationCountryCode()));
            }
            
            Predicate finalPredicate = cb.and(predicates.toArray(new Predicate[]{}));
            System.out.println("Total predicates: " + predicates.size());
            System.out.println("=== END EQUIPMENT SEARCH DEBUG ===");
            return finalPredicate;
        });
    }

    default List<Consignment> findAllForCarried(SearchWithIdentifiersRequestDto request) {
        return this.findAll((root, query, cb) -> {
            final List<Predicate> predicates = new ArrayList<>();
            Join<Consignment, MainCarriageTransportMovement> mainCarriageTransportMovementJoin = root.join(MOVEMENTS, JoinType.LEFT);
            Join<Consignment, UsedTransportEquipment> equipmentJoin = root.join(TRANSPORT_VEHICLES, JoinType.LEFT);
            Join<UsedTransportEquipment, CarriedTransportEquipment> carriedJoin = equipmentJoin.join(CARRIED_TRANSPORT_EQUIPMENTS, JoinType.LEFT);

            // Normalize identifier by removing dashes and non-alphanumeric characters for comparison
            String normalizedSearchId = request.getIdentifier().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
            Expression<String> normalizedDbId = cb.function("REPLACE", String.class,
                    cb.upper(carriedJoin.get(VEHICLE_ID)),
                    cb.literal("-"),
                    cb.literal(""));
            // Remove any remaining non-alphanumeric characters (spaces, etc.)
            normalizedDbId = cb.function("REPLACE", String.class, normalizedDbId, cb.literal(" "), cb.literal(""));
            predicates.add(cb.equal(normalizedDbId, normalizedSearchId));

            buildCommonAttributesRequest(request, cb, predicates, mainCarriageTransportMovementJoin);

            return cb.and(predicates.toArray(new Predicate[]{}));
        });
    }

    private void buildCommonAttributesRequest(SearchWithIdentifiersRequestDto request, CriteriaBuilder cb, List<Predicate> predicates, Join<Consignment, MainCarriageTransportMovement> mainCarriageTransportMovementJoin) {
        if (request.getDangerousGoodsIndicator() != null) {
            predicates.add(cb.and(cb.equal(mainCarriageTransportMovementJoin.get(IS_DANGEROUS_GOODS), request.getDangerousGoodsIndicator())));
        }
        if (StringUtils.isNotBlank(request.getModeCode())) {
            predicates.add(cb.and(cb.equal(mainCarriageTransportMovementJoin.get(TRANSPORT_MODE), request.getModeCode())));
        }
    }
}
