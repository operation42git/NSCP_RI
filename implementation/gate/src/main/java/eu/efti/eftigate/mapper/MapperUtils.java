package eu.efti.eftigate.mapper;

import eu.efti.commons.dto.ControlDto;
import eu.efti.commons.dto.RequestDto;
import eu.efti.commons.dto.identifiers.CarriedTransportEquipmentDto;
import eu.efti.commons.dto.identifiers.ConsignmentDto;
import eu.efti.commons.dto.identifiers.MainCarriageTransportMovementDto;
import eu.efti.commons.dto.identifiers.UsedTransportEquipmentDto;
import eu.efti.commons.dto.identifiers.api.CarriedTransportEquipmentApiDto;
import eu.efti.commons.dto.identifiers.api.ConsignmentApiDto;
import eu.efti.commons.dto.identifiers.api.MainCarriageTransportMovementApiDto;
import eu.efti.commons.dto.identifiers.api.UsedTransportEquipmentApiDto;
import eu.efti.eftigate.dto.RabbitRequestDto;
import eu.efti.eftigate.entity.ControlEntity;
import eu.efti.eftigate.entity.ErrorEntity;
import eu.efti.eftigate.entity.IdentifiersRequestEntity;
import eu.efti.eftigate.entity.RequestEntity;
import eu.efti.eftigate.entity.UilRequestEntity;
import eu.efti.identifiersregistry.IdentifiersMapper;
import eu.efti.v1.edelivery.Consignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MapperUtils {

    private final ModelMapper modelMapper;
    private final IdentifiersMapper identifiersMapper;

    public ControlEntity controlDtoToControlEntity(final ControlDto controlDto) {
        final ControlEntity controlEntity = modelMapper.map(controlDto, ControlEntity.class);

        //ça marche pas sinon
        if (controlDto.getError() != null) {
            final ErrorEntity errorEntity = new ErrorEntity();
            errorEntity.setErrorCode(controlDto.getError().getErrorCode());
            errorEntity.setErrorDescription(controlDto.getError().getErrorDescription());
            errorEntity.setId(controlDto.getError().getId());
            controlEntity.setError(errorEntity);
        }
        return controlEntity;
    }

    public ControlDto controlEntityToControlDto(final ControlEntity controlEntity) {
        final ControlDto controlDto = modelMapper.map(controlEntity, ControlDto.class);
        final List<ConsignmentDto> consignmentDtoList = CollectionUtils.emptyIfNull(controlEntity.getRequests()).stream()
                .filter(IdentifiersRequestEntity.class::isInstance)
                .map(IdentifiersRequestEntity.class::cast)
                .filter(identifiersRequestEntity -> identifiersRequestEntity.getIdentifiersResults() != null
                        && CollectionUtils.isNotEmpty(identifiersRequestEntity.getIdentifiersResults().getConsignments()))
                .flatMap(request -> request.getIdentifiersResults().getConsignments().stream())
                .sorted(Comparator.comparing(ConsignmentDto::getGateId))
                .toList();
        controlDto.setIdentifiersResults(consignmentDtoList);
        final byte[] byteArray = CollectionUtils.emptyIfNull(controlEntity.getRequests()).stream()
                .filter(UilRequestEntity.class::isInstance)
                .map(UilRequestEntity.class::cast)
                .map(UilRequestEntity::getReponseData)
                .filter(ArrayUtils::isNotEmpty)
                .collect(ByteArrayOutputStream::new, (byteArrayOutputStream, bytes) -> byteArrayOutputStream.write(bytes, 0, bytes.length), (arrayOutputStream, byteArrayOutputStream) -> {
                })
                .toByteArray();
        controlDto.setEftiData(byteArray);
        return controlDto;
    }

    public <T extends RequestEntity> T requestDtoToRequestEntity(final RequestDto requestDto, final Class<T> destinationClass) {
        return modelMapper.map(requestDto, destinationClass);
    }

    public <T extends RequestDto> T rabbitRequestDtoToRequestDto(final RabbitRequestDto rabbitRequestDto, final Class<T> destinationClass) {
        return modelMapper.map(rabbitRequestDto, destinationClass);
    }

    public <T extends RequestEntity, D extends RequestDto> D requestToRequestDto(final T requestEntity, final Class<D> destinationClass) {
        log.debug("=== REQUEST_TO_REQUEST_DTO START ===");
        log.debug("Mapping entity type: {} to DTO type: {}", requestEntity.getClass().getSimpleName(), destinationClass.getSimpleName());
        
        D dto = modelMapper.map(requestEntity, destinationClass);
        log.debug("ModelMapper mapping completed");
        
        // Special handling for IdentifiersRequestEntity -> IdentifiersRequestDto mapping
        // ModelMapper doesn't automatically map IdentifiersResults (entity) to IdentifiersResultsDto (DTO)
        if (requestEntity instanceof eu.efti.eftigate.entity.IdentifiersRequestEntity identifiersEntity 
            && dto instanceof eu.efti.commons.dto.IdentifiersRequestDto identifiersDto) {
            log.info("Special handling for IdentifiersRequestEntity -> IdentifiersRequestDto");
            log.info("  Entity identifiersResults exists: {}", identifiersEntity.getIdentifiersResults() != null);
            
            if (identifiersEntity.getIdentifiersResults() != null) {
                log.info("  Entity consignments count: {}", 
                    identifiersEntity.getIdentifiersResults().getConsignments() != null 
                        ? identifiersEntity.getIdentifiersResults().getConsignments().size() : 0);
                
                eu.efti.commons.dto.IdentifiersResultsDto resultsDto = eu.efti.commons.dto.IdentifiersResultsDto.builder()
                        .consignments(identifiersEntity.getIdentifiersResults().getConsignments())
                        .build();
                identifiersDto.setIdentifiersResults(resultsDto);
                
                log.info("  Set DTO identifiersResults with {} consignments", 
                    resultsDto.getConsignments() != null ? resultsDto.getConsignments().size() : 0);
            } else {
                log.warn("  Entity identifiersResults is null, DTO will have null identifiersResults");
            }
            
            log.info("  Final DTO identifiersResults exists: {}, consignments count: {}", 
                identifiersDto.getIdentifiersResults() != null,
                identifiersDto.getIdentifiersResults() != null && identifiersDto.getIdentifiersResults().getConsignments() != null
                    ? identifiersDto.getIdentifiersResults().getConsignments().size() : 0);
        }
        
        log.debug("=== REQUEST_TO_REQUEST_DTO END ===");
        return dto;
    }

    public ConsignmentDto eDeliveryToDto(final Consignment consignment) {
        //todo fix this double mapping
        return this.modelMapper.map(this.identifiersMapper.eDeliveryToEntity(consignment), ConsignmentDto.class);
    }

    public List<ConsignmentDto> eDeliveryToDto(final List<Consignment> consignments) {
        return CollectionUtils.emptyIfNull(consignments).stream().map(this::eDeliveryToDto).toList();

    }

    public Consignment dtoToEdelivery(final ConsignmentDto consignment) {
        //todo fix double mapping
        return this.identifiersMapper.entityToEdelivery(this.dtoToEntity(consignment));
    }

    public List<Consignment> dtoToEdelivery(final List<ConsignmentDto> consignments) {
        return CollectionUtils.emptyIfNull(consignments).stream().map(this::dtoToEdelivery).toList();

    }

    public ConsignmentDto entityToDto(final eu.efti.identifiersregistry.entity.Consignment consignment) {
        return modelMapper.map(consignment, ConsignmentDto.class);
    }

    public eu.efti.identifiersregistry.entity.Consignment dtoToEntity(final ConsignmentDto consignmentDto) {
        return modelMapper.map(consignmentDto, eu.efti.identifiersregistry.entity.Consignment.class);
    }

    public List<eu.efti.identifiersregistry.entity.Consignment> dtoToEntity(final List<ConsignmentDto> consignmentDtoList) {
        return CollectionUtils.emptyIfNull(consignmentDtoList).stream().map(this::dtoToEntity).toList();
    }

    public List<ConsignmentApiDto> consignmentDtoToApiDto(List<ConsignmentDto> consignmentDtos) {
        return CollectionUtils.emptyIfNull(consignmentDtos).stream().map(this::dtoToApiDto).toList();
    }

    private ConsignmentApiDto dtoToApiDto(ConsignmentDto consignmentDto) {
        return modelMapper.map(consignmentDto, ConsignmentApiDto.class);
    }

    public ConsignmentDto apiDtoToConsignmentDto(ConsignmentApiDto apiDto) {
        // IMPORTANT: do NOT use ModelMapper here.
        // ConsignmentApiDto has multiple "*Id" fields (gateId/datasetId/platformId) while ConsignmentDto also has an "id" field,
        // which causes ambiguous mapping ("matches multiple source property hierarchies") and breaks cross-gate REST aggregation.
        if (apiDto == null) {
            return null;
        }
        return ConsignmentDto.builder()
                .id(0L)
                .platformId(apiDto.getPlatformId())
                .datasetId(apiDto.getDatasetId())
                .gateId(apiDto.getGateId())
                .carrierAcceptanceDatetime(apiDto.getCarrierAcceptanceDatetime())
                .deliveryEventActualOccurrenceDatetime(apiDto.getDeliveryEventActualOccurrenceDatetime())
                .mainCarriageTransportMovements(apiDto.getMainCarriageTransportMovements() == null ? null :
                        apiDto.getMainCarriageTransportMovements().stream().map(this::apiDtoToMainCarriageTransportMovementDto).toList())
                .usedTransportEquipments(apiDto.getUsedTransportEquipments() == null ? null :
                        apiDto.getUsedTransportEquipments().stream().map(this::apiDtoToUsedTransportEquipmentDto).toList())
                .build();
    }

    public List<ConsignmentDto> apiDtoToConsignmentDto(List<ConsignmentApiDto> apiDtos) {
        return CollectionUtils.emptyIfNull(apiDtos).stream().map(this::apiDtoToConsignmentDto).toList();
    }

    private MainCarriageTransportMovementDto apiDtoToMainCarriageTransportMovementDto(final MainCarriageTransportMovementApiDto apiDto) {
        if (apiDto == null) {
            return null;
        }
        short modeCode = 0;
        if (StringUtils.isNotBlank(apiDto.getModeCode())) {
            try {
                modeCode = Short.parseShort(apiDto.getModeCode());
            } catch (NumberFormatException ignored) {
                // keep default 0; modeCode is optional on the API side
            }
        }

        return MainCarriageTransportMovementDto.builder()
                .id(0L)
                .modeCode(modeCode)
                .schemeAgencyId(apiDto.getSchemeAgencyId())
                .dangerousGoodsIndicator(apiDto.isDangerousGoodsIndicator())
                .usedTransportMeansId(apiDto.getId())
                .usedTransportMeansRegistrationCountry(apiDto.getRegistrationCountryCode())
                .build();
    }

    private UsedTransportEquipmentDto apiDtoToUsedTransportEquipmentDto(final UsedTransportEquipmentApiDto apiDto) {
        if (apiDto == null) {
            return null;
        }

        return UsedTransportEquipmentDto.builder()
                .id(0L)
                .sequenceNumber(apiDto.getSequenceNumber())
                .equipmentId(apiDto.getId())
                .schemeAgencyId(apiDto.getSchemeAgencyId())
                .registrationCountry(apiDto.getRegistrationCountry())
                .categoryCode(apiDto.getCategoryCode())
                .carriedTransportEquipments(apiDto.getCarriedTransportEquipments() == null ? null :
                        apiDto.getCarriedTransportEquipments().stream().map(this::apiDtoToCarriedTransportEquipmentDto).toList())
                .build();
    }

    private CarriedTransportEquipmentDto apiDtoToCarriedTransportEquipmentDto(final CarriedTransportEquipmentApiDto apiDto) {
        if (apiDto == null) {
            return null;
        }
        return CarriedTransportEquipmentDto.builder()
                .id(0L)
                .sequenceNumber(apiDto.getSequenceNumber())
                .equipmentId(apiDto.getId())
                .schemeAgencyId(apiDto.getSchemeAgencyId())
                .build();
    }
}
