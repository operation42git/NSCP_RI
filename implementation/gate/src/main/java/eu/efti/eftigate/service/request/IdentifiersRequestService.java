package eu.efti.eftigate.service.request;

import eu.efti.commons.dto.ControlDto;
import eu.efti.commons.dto.IdentifiersRequestDto;
import eu.efti.commons.dto.IdentifiersResponseDto;
import eu.efti.commons.dto.IdentifiersResultsDto;
import eu.efti.commons.dto.RequestDto;
import eu.efti.commons.dto.SaveIdentifiersRequestWrapper;
import eu.efti.commons.dto.SearchParameter;
import eu.efti.commons.dto.SearchWithIdentifiersRequestDto;
import eu.efti.commons.dto.identifiers.ConsignmentDto;
import eu.efti.commons.dto.identifiers.api.ConsignmentApiDto;
import eu.efti.commons.dto.identifiers.api.IdentifierRequestResultDto;
import eu.efti.commons.enums.RequestStatusEnum;
import eu.efti.commons.enums.RequestType;
import eu.efti.commons.enums.RequestTypeEnum;
import eu.efti.commons.enums.StatusEnum;
import eu.efti.commons.utils.SerializeUtils;
import eu.efti.edeliveryapconnector.constant.EDeliveryStatus;
import eu.efti.edeliveryapconnector.dto.NotificationDto;
import eu.efti.edeliveryapconnector.service.RequestUpdaterService;
import eu.efti.eftigate.config.GateProperties;
import eu.efti.eftigate.dto.RabbitRequestDto;
import eu.efti.eftigate.entity.ErrorEntity;
import eu.efti.eftigate.entity.IdentifiersRequestEntity;
import eu.efti.eftigate.entity.IdentifiersResults;
import eu.efti.eftigate.entity.RequestEntity;
import eu.efti.eftigate.exception.RequestNotFoundException;
import eu.efti.eftigate.mapper.MapperUtils;
import eu.efti.eftigate.repository.IdentifiersRequestRepository;
import eu.efti.eftigate.service.ControlService;
import eu.efti.eftigate.service.LogManager;
import eu.efti.eftigate.service.RabbitSenderService;
import eu.efti.eftigate.service.gate.EftiGateIdResolver;
import eu.efti.identifiersregistry.service.IdentifiersService;
import eu.efti.v1.edelivery.Identifier;
import eu.efti.v1.edelivery.IdentifierQuery;
import eu.efti.v1.edelivery.IdentifierResponse;
import eu.efti.v1.edelivery.IdentifierType;
import jakarta.xml.bind.JAXBElement;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import static eu.efti.commons.constant.EftiGateConstants.IDENTIFIERS_TYPES;
import static eu.efti.commons.enums.RequestStatusEnum.IN_PROGRESS;
import static eu.efti.commons.enums.RequestStatusEnum.RECEIVED;
import static eu.efti.commons.enums.RequestStatusEnum.RESPONSE_IN_PROGRESS;
import static eu.efti.commons.enums.RequestStatusEnum.SUCCESS;
import static eu.efti.commons.enums.RequestTypeEnum.EXTERNAL_ASK_IDENTIFIERS_SEARCH;
import static eu.efti.commons.enums.RequestTypeEnum.EXTERNAL_IDENTIFIERS_SEARCH;
import static eu.efti.commons.enums.RequestTypeEnum.LOCAL_IDENTIFIERS_SEARCH;
import static eu.efti.eftilogger.model.ComponentType.GATE;
import static eu.efti.eftilogger.model.ComponentType.REGISTRY;
import static org.apache.commons.collections4.CollectionUtils.isNotEmpty;

@Slf4j
@Component
public class IdentifiersRequestService extends RequestService<IdentifiersRequestEntity> {

    public static final String IDENTIFIER = "IDENTIFIER";
    @Lazy
    private final IdentifiersService identifiersService;
    private final IdentifiersRequestRepository identifiersRequestRepository;
    private final IdentifiersControlUpdateDelegateService identifiersControlUpdateDelegateService;
    private final ValidationService validationService;
    private final GateProperties gateProperties;
    @Lazy
    private final EftiGateIdResolver eftiGateIdResolver;

    public IdentifiersRequestService(final IdentifiersRequestRepository identifiersRequestRepository,
                                     final MapperUtils mapperUtils,
                                     final RabbitSenderService rabbitSenderService,
                                     final ControlService controlService,
                                     final GateProperties gateProperties,
                                     final IdentifiersService identifiersService,
                                     final RequestUpdaterService requestUpdaterService,
                                     final SerializeUtils serializeUtils,
                                     final LogManager logManager,
                                     final IdentifiersControlUpdateDelegateService identifiersControlUpdateDelegateService,
                                     final ValidationService validationService,
                                     final EftiGateIdResolver eftiGateIdResolver) {
        super(mapperUtils, rabbitSenderService, controlService, gateProperties, requestUpdaterService, serializeUtils, logManager);
        this.identifiersService = identifiersService;
        this.identifiersRequestRepository = identifiersRequestRepository;
        this.identifiersControlUpdateDelegateService = identifiersControlUpdateDelegateService;
        this.validationService = validationService;
        this.gateProperties = gateProperties;
        this.eftiGateIdResolver = eftiGateIdResolver;
    }


    @Override
    public boolean allRequestsContainsData(final List<RequestEntity> controlEntityRequests) {
        return CollectionUtils.emptyIfNull(controlEntityRequests).stream()
                .filter(IdentifiersRequestEntity.class::isInstance)
                .map(IdentifiersRequestEntity.class::cast)
                .allMatch(requestEntity -> Objects.nonNull(requestEntity.getIdentifiersResults()) && isNotEmpty(requestEntity.getIdentifiersResults().getConsignments()));
    }

    public void manageQueryReceived(final NotificationDto notificationDto) {
        Optional<String> result = validationService.isXmlValid(notificationDto.getContent().getBody());
        if (result.isPresent()) {
            log.error("Received invalid IdentifierQuery");
            this.sendRequest(this.buildErrorRequestDto(notificationDto, EXTERNAL_ASK_IDENTIFIERS_SEARCH, result.get()));
            return;
        }
        final IdentifierQuery identifierQuery = getSerializeUtils().mapXmlStringToJaxbObject(notificationDto.getContent().getBody());
        final ControlDto controlDto = getControlService().createControlFrom(identifierQuery, notificationDto.getContent().getFromPartyId());
        //log fti015
        getLogManager().logRequestRegistry(controlDto, null, GATE, REGISTRY, LogManager.FTI_015);
        
        // Build search request DTO and set eftiGateIndicator to receiving gate's country
        // to prevent fan-out - this gate should search locally only
        SearchWithIdentifiersRequestDto searchRequestDto = buildIdentifiersRequestDtoFrom(identifierQuery);
        String receivingGateCountry = eftiGateIdResolver.resolve(gateProperties.getOwner());
        if (receivingGateCountry != null) {
            // Set gate indicator to receiving gate's country to ensure it only searches locally
            searchRequestDto.setEftiGateIndicator(List.of(receivingGateCountry));
            log.debug("Setting eftiGateIndicator to {} for received IdentifierQuery to prevent fan-out", receivingGateCountry);
        }
        
        final List<ConsignmentDto> identifiersDtoList = identifiersService.search(searchRequestDto);
        controlDto.setIdentifiersResults(identifiersDtoList);
        getControlService().save(controlDto);
        //log fti016
        getLogManager().logRequestRegistry(controlDto, getSerializeUtils().mapObjectToBase64String(identifiersDtoList), REGISTRY, GATE, LogManager.FTI_016);
        final RequestDto request = createReceivedRequest(controlDto, identifiersDtoList);
        final RequestDto updatedRequest = this.updateStatus(request, RESPONSE_IN_PROGRESS);
        super.sendRequest(updatedRequest);
    }

    public void manageResponseReceived(final NotificationDto notificationDto) {
        String body = notificationDto.getContent().getBody();
        Optional<String> result = validationService.isXmlValid(notificationDto.getContent().getBody());
        if (result.isPresent()) {
            log.error("Received invalid IdentifierResponse");
            this.sendRequest(this.buildErrorRequestDto(notificationDto, EXTERNAL_ASK_IDENTIFIERS_SEARCH, result.get()));
            return;
        }
        final IdentifierResponse response = getSerializeUtils().mapXmlStringToJaxbObject(body);
        String requestId = response.getRequestId();
        if (getControlService().findByRequestId(requestId).isPresent()) {
            String fromPartyId = notificationDto.getContent().getFromPartyId();
            identifiersControlUpdateDelegateService.updateExistingControl(response, fromPartyId);
            identifiersControlUpdateDelegateService.setControlNextStatus(requestId);
            IdentifiersRequestEntity identifiersRequestEntity = identifiersRequestRepository.findByControlRequestIdAndGateIdDest(requestId, fromPartyId);

            //log fti021
            getLogManager().logReceivedMessage(getMapperUtils().controlEntityToControlDto(identifiersRequestEntity.getControl()), GATE, GATE, body, fromPartyId,
                    getStatusEnumOfRequest(identifiersRequestEntity), LogManager.FTI_021);
        }
    }

    @Override
    public void manageSendSuccess(final String eDeliveryMessageId) {
        final IdentifiersRequestEntity externalRequest = identifiersRequestRepository.findByControlRequestTypeAndStatusAndEdeliveryMessageId(EXTERNAL_ASK_IDENTIFIERS_SEARCH,
                RESPONSE_IN_PROGRESS, eDeliveryMessageId);
        if (externalRequest == null) {
            log.info(" sent message {} successfully", eDeliveryMessageId);
        } else {
            externalRequest.getControl().setStatus(StatusEnum.COMPLETE);
            this.updateStatus(externalRequest, SUCCESS);
        }
    }

    @Override
    public boolean supports(final RequestTypeEnum requestTypeEnum) {
        return IDENTIFIERS_TYPES.contains(requestTypeEnum);
    }

    @Override
    public boolean supports(final String requestType) {
        return IDENTIFIER.equalsIgnoreCase(requestType);
    }

    @Override
    public IdentifiersRequestDto createRequest(final ControlDto controlDto) {
        return new IdentifiersRequestDto(controlDto);
    }

    @Override
    public String buildRequestBody(final RabbitRequestDto requestDto) {
        final ControlDto controlDto = requestDto.getControl();
        if (EXTERNAL_ASK_IDENTIFIERS_SEARCH == controlDto.getRequestType()) { //remote sending response
            return getSerializeUtils().mapJaxbObjectToXmlString(this.buildEdeliveryIdentifiersResponse(requestDto), IdentifierResponse.class);
        } else { //local sending request
            return getSerializeUtils().mapJaxbObjectToXmlString(this.buildQueryFromControl(controlDto), IdentifierQuery.class);
        }
    }

    @Override
    public IdentifiersRequestDto save(final RequestDto requestDto) {
        return getMapperUtils().requestToRequestDto(
                identifiersRequestRepository.save(getMapperUtils().requestDtoToRequestEntity(requestDto, IdentifiersRequestEntity.class)),
                IdentifiersRequestDto.class);
    }

    @Override
    public void saveRequest(RequestDto requestDto) {
        identifiersRequestRepository.save(getMapperUtils().requestDtoToRequestEntity(requestDto, IdentifiersRequestEntity.class));
    }

    @Override
    protected void updateStatus(final IdentifiersRequestEntity identifiersRequestEntity, final RequestStatusEnum status) {
        identifiersRequestEntity.setStatus(status);
        getControlService().save(identifiersRequestEntity.getControl());
        identifiersRequestRepository.save(identifiersRequestEntity);
    }

    @Override
    protected IdentifiersRequestEntity findRequestByMessageIdOrThrow(final String eDeliveryMessageId) {
        return Optional.ofNullable(this.identifiersRequestRepository.findByEdeliveryMessageId(eDeliveryMessageId))
                .orElseThrow(() -> new RequestNotFoundException("couldn't find Consignment request for messageId: " + eDeliveryMessageId));
    }

    @Override
    public void updateRequestStatus(final RequestDto requestDto, final String edeliveryMessageId) {
        requestDto.setEdeliveryMessageId(edeliveryMessageId);
        this.updateStatus(requestDto, isExternalRequest(requestDto) ? RESPONSE_IN_PROGRESS : RequestStatusEnum.IN_PROGRESS);
    }

    @Override
    public List<IdentifiersRequestEntity> findAllForControlId(final int controlId) {
        return identifiersRequestRepository.findByControlId(controlId);
    }

    public void createOrUpdate(final NotificationDto notificationDto) {
        final Optional<String> validationResult = validationService.isXmlValid(notificationDto.getContent().getBody());
        if (validationResult.isPresent()) {
            log.error("Received invalid SaveIdentifierRequest from {}", notificationDto.getContent().getFromPartyId());
            return;
        }

        this.identifiersService.createOrUpdate(new SaveIdentifiersRequestWrapper(notificationDto.getContent().getFromPartyId(),
                getSerializeUtils().mapXmlStringToJaxbObject(notificationDto.getContent().getBody())));
    }

    private RequestDto createReceivedRequest(final ControlDto controlDto, final List<ConsignmentDto> identifiersDtos) {
        final RequestDto request = createRequest(controlDto, RECEIVED, identifiersDtos);
        final ControlDto updatedControl = updateControl(controlDto);
        if (StatusEnum.COMPLETE == updatedControl.getStatus()) {
            request.setStatus(RESPONSE_IN_PROGRESS);
        }
        request.setControl(updatedControl);
        return request;
    }

    public ControlDto updateControl(ControlDto controlDto) {
        return getControlService().updateControl(controlDto.getRequestId());
    }

    public IdentifiersRequestDto createRequest(final ControlDto controlDto, final RequestStatusEnum status, final List<ConsignmentDto> identifiersDtoList) {
        final IdentifiersRequestDto requestDto = save(buildRequestDto(controlDto, status, identifiersDtoList));
        log.info("Request has been register with controlId : {}", requestDto.getControl().getId());
        return requestDto;
    }

    private IdentifiersRequestDto buildRequestDto(final ControlDto controlDto, final RequestStatusEnum status, final List<ConsignmentDto> identifiersDtoList) {
        return IdentifiersRequestDto.builder()
                .retry(0)
                .control(controlDto)
                .status(status)
                .identifiersResults(IdentifiersResultsDto.builder().consignments(identifiersDtoList).build())
                .gateIdDest(controlDto.getFromGateId() != null ? controlDto.getFromGateId() : gateProperties.getOwner())
                .requestType(RequestType.IDENTIFIER)
                .build();
    }

    private SearchWithIdentifiersRequestDto buildIdentifiersRequestDtoFrom(final IdentifierQuery identifierQuery) {
        Identifier identifier = identifierQuery.getIdentifier();
        return SearchWithIdentifiersRequestDto.builder()
                .identifier(identifier.getValue())
                .identifierType(CollectionUtils.emptyIfNull(identifier.getType()).stream().map(IdentifierType::value).toList())
                .dangerousGoodsIndicator(identifierQuery.isDangerousGoodsIndicator())
                .modeCode(identifierQuery.getModeCode())
                .registrationCountryCode(identifierQuery.getRegistrationCountryCode())
                .build();
    }

    private JAXBElement<IdentifierQuery> buildQueryFromControl(final ControlDto controlDto) {
        final SearchParameter searchParameter = controlDto.getTransportIdentifiers();
        final IdentifierQuery identifierQuery = new IdentifierQuery();
        identifierQuery.setRequestId(controlDto.getRequestId());
        if (searchParameter != null) {
            final Identifier identifier = new Identifier();
            identifier.setValue(searchParameter.getIdentifier());
            try {
                CollectionUtils.emptyIfNull(searchParameter.getIdentifierType()).stream()
                        .filter(StringUtils::isNotBlank)
                        .forEach(type -> identifier.getType().add(IdentifierType.fromValue(type.toLowerCase())));
            } catch (final IllegalArgumentException e) {
                log.error("unknown identifier type {}", e.getMessage());
            }
            identifierQuery.setIdentifier(identifier);
            identifierQuery.setModeCode(searchParameter.getModeCode());
            identifierQuery.setDangerousGoodsIndicator(searchParameter.getDangerousGoodsIndicator());
            identifierQuery.setRegistrationCountryCode(searchParameter.getRegistrationCountryCode());
        }

        return getObjectFactory().createIdentifierQuery(identifierQuery);
    }

    private JAXBElement<IdentifierResponse> buildEdeliveryIdentifiersResponse(final RabbitRequestDto requestDto) {
        final ControlDto controlDto = requestDto.getControl();
        final IdentifierResponse identifierResponse = new IdentifierResponse();
        identifierResponse.setRequestId(controlDto.getRequestId());
        identifierResponse.setStatus(EDeliveryStatus.OK.getCode());
        if (controlDto.getError() != null) {
            identifierResponse.setDescription(controlDto.getError().getErrorDescription());
        }
        if (requestDto.getIdentifiersResults() != null) {
            identifierResponse.getConsignment().addAll(getMapperUtils().dtoToEdelivery(requestDto.getIdentifiersResults().getConsignments()));
        }
        return getObjectFactory().createIdentifierResponse(identifierResponse);
    }

    /**
     * Update request status to IN_PROGRESS when REST API call is initiated.
     * This ensures the request entity exists and is in the correct state.
     */
    public void manageRestRequestInProgress(String requestId) {
        List<IdentifiersRequestEntity> requests = identifiersRequestRepository.findByControlRequestId(requestId);
        Optional<IdentifiersRequestEntity> request = requests.stream()
                .filter(r -> RequestStatusEnum.RECEIVED.equals(r.getStatus()))
                .findFirst();
        request.ifPresentOrElse(
                req -> updateStatus(req, RequestStatusEnum.IN_PROGRESS),
                () -> log.error("Not found identifier request with requestId {} and status RECEIVED", requestId));
    }

    /**
     * Process REST API response for identifier search.
     * Extracts consignments from IdentifiersResponseDto and updates the request entity.
     */
    public void manageRestResponseReceived(String requestId, IdentifiersResponseDto response) {
        log.info("=== MANAGE_REST_RESPONSE_RECEIVED START ===");
        log.info("RequestId: {}, Response status: {}", requestId, response.getStatus());
        log.info("Response identifiers count: {}", response.getIdentifiers() != null ? response.getIdentifiers().size() : 0);
        
        if (response.getIdentifiers() != null) {
            for (int i = 0; i < response.getIdentifiers().size(); i++) {
                var identifier = response.getIdentifiers().get(i);
                log.info("  Identifier[{}]: gateIndicator={}, status={}, consignments count={}", 
                    i, identifier.getGateIndicator(), identifier.getStatus(), 
                    identifier.getConsignments() != null ? identifier.getConsignments().size() : 0);
            }
        }
        
        // Find all entities for this requestId
        final List<IdentifiersRequestEntity> entities = identifiersRequestRepository.findByControlRequestId(requestId);
        log.info("Found {} entities for requestId", entities.size());
        
        if (entities.isEmpty()) {
            log.error("No identifier request entities found in DB for requestId: {}", requestId);
            return;
        }
        
        // Get the request type from the first entity (all should have the same type)
        RequestTypeEnum requestType = entities.get(0).getControl().getRequestType();
        log.info("Request type: {}", requestType);
        
        // Handle REST API responses (gate-to-gate calls)
        if (!List.of(LOCAL_IDENTIFIERS_SEARCH, EXTERNAL_IDENTIFIERS_SEARCH, EXTERNAL_ASK_IDENTIFIERS_SEARCH).contains(requestType)) {
            throw new IllegalStateException("should only be called for REST API identifier requests, but got: " + requestType);
        }
        
        // Process each identifier result separately and save consignments to the matching entity
        if (response.getIdentifiers() != null && !response.getIdentifiers().isEmpty()) {
            int totalConsignmentsSaved = 0;
            
            for (IdentifierRequestResultDto identifierResult : response.getIdentifiers()) {
                String gateIndicator = identifierResult.getGateIndicator();
                log.info("Processing identifier result for gateIndicator: {}", gateIndicator);
                
                // Find the entity that matches this gateIndicator
                // Match by converting entity's gateIdDest to country indicator
                log.info("Looking for entity matching gateIndicator: {}", gateIndicator);
                log.info("Available entities:");
                entities.forEach(e -> {
                    String entityGateIndicator = eftiGateIdResolver.resolve(e.getGateIdDest());
                    log.info("  Entity ID: {}, gateIdDest: {}, resolved gateIndicator: {}, status: {}", 
                        e.getId(), e.getGateIdDest(), entityGateIndicator, e.getStatus());
                });
                
                Optional<IdentifiersRequestEntity> matchingEntity = entities.stream()
                        .filter(e -> {
                            String entityGateIndicator = eftiGateIdResolver.resolve(e.getGateIdDest());
                            boolean matches = gateIndicator.equals(entityGateIndicator);
                            log.info("Entity ID: {}, gateIdDest={}, resolved to={}, matches={}", 
                                e.getId(), e.getGateIdDest(), entityGateIndicator, matches);
                            return matches;
                        })
                        .filter(e -> {
                            boolean statusMatches = RequestStatusEnum.IN_PROGRESS.equals(e.getStatus()) || 
                                    RequestStatusEnum.RECEIVED.equals(e.getStatus());
                            log.info("Entity ID: {}, status: {}, statusMatches: {}", 
                                e.getId(), e.getStatus(), statusMatches);
                            return statusMatches;
                        })
                        .findFirst();
                
                if (matchingEntity.isPresent()) {
                    IdentifiersRequestEntity entity = matchingEntity.get();
                    log.info("Found matching entity ID: {} for gateIndicator: {}", entity.getId(), gateIndicator);
                    
                    // Convert consignments from API DTOs to DTOs
                    List<ConsignmentDto> consignments = new ArrayList<>();
                    if (identifierResult.getConsignments() != null && !identifierResult.getConsignments().isEmpty()) {
                        consignments = identifierResult.getConsignments().stream()
                                .map(this::apiDtoToConsignmentDto)
                                .collect(java.util.stream.Collectors.toList());
                        log.info("Converted {} consignments for gateIndicator: {}", consignments.size(), gateIndicator);
                    } else {
                        log.info("No consignments in identifier result for gateIndicator: {}", gateIndicator);
                    }
                    
                    // Update entity's identifiersResults
                    IdentifiersResults identifiersResults = IdentifiersResults.builder().consignments(consignments).build();
                    entity.setIdentifiersResults(identifiersResults);
                    log.info("Set identifiersResults on entity ID {}: {} consignments", 
                        entity.getId(),
                        entity.getIdentifiersResults() != null && entity.getIdentifiersResults().getConsignments() != null 
                            ? entity.getIdentifiersResults().getConsignments().size() : 0);
                    
                    // Set error if present in this identifier result
                    if (identifierResult.getErrorCode() != null || identifierResult.getErrorDescription() != null) {
                        ErrorEntity errorEntity = ErrorEntity.builder()
                                .errorCode(identifierResult.getErrorCode())
                                .errorDescription(identifierResult.getErrorDescription())
                                .build();
                        entity.setError(errorEntity);
                        updateStatus(entity, RequestStatusEnum.ERROR);
                        log.info("Updated entity ID {} status to ERROR", entity.getId());
                    } else if (identifierResult.getStatus() != null && "ERROR".equals(identifierResult.getStatus())) {
                        updateStatus(entity, RequestStatusEnum.ERROR);
                        log.info("Updated entity ID {} status to ERROR", entity.getId());
                    } else {
                        updateStatus(entity, RequestStatusEnum.SUCCESS);
                        log.info("Updated entity ID {} status to SUCCESS", entity.getId());
                    }
                    
                    totalConsignmentsSaved += consignments.size();
                    
                    // Verify entity was saved correctly
                    IdentifiersRequestEntity savedEntity = identifiersRequestRepository.findById(entity.getId()).orElse(null);
                    if (savedEntity != null) {
                        log.info("After save - Entity ID: {}, identifiersResults exists: {}, consignments count: {}", 
                            savedEntity.getId(),
                            savedEntity.getIdentifiersResults() != null,
                            savedEntity.getIdentifiersResults() != null && savedEntity.getIdentifiersResults().getConsignments() != null 
                                ? savedEntity.getIdentifiersResults().getConsignments().size() : 0);
                    } else {
                        log.error("Could not retrieve saved entity!");
                    }
                } else {
                    log.warn("No matching entity found for gateIndicator: {} (status IN_PROGRESS or RECEIVED)", gateIndicator);
                    log.warn("Available entities: {}", entities.stream()
                        .map(e -> String.format("id=%d, gateIdDest=%s, resolved=%s, status=%s", 
                            e.getId(), e.getGateIdDest(), eftiGateIdResolver.resolve(e.getGateIdDest()), e.getStatus()))
                        .collect(Collectors.joining(", ")));
                }
            }
            
            // Update control status based on overall response status
            if (!entities.isEmpty()) {
                ControlDto controlDto = getMapperUtils().controlEntityToControlDto(entities.get(0).getControl());
                if (response.getStatus() == StatusEnum.COMPLETE) {
                    getControlService().updateControlStatus(controlDto, StatusEnum.COMPLETE);
                } else if (response.getStatus() == StatusEnum.ERROR) {
                    controlDto.setStatus(StatusEnum.ERROR);
                    if (response.getErrorCode() != null || response.getErrorDescription() != null) {
                        controlDto.setError(eu.efti.commons.dto.ErrorDto.builder()
                                .errorCode(response.getErrorCode())
                                .errorDescription(response.getErrorDescription())
                                .build());
                    }
                    getControlService().save(controlDto);
                }
            }
            
            log.info("=== MANAGE_REST_RESPONSE_RECEIVED END: {} total consignments saved ===", totalConsignmentsSaved);
        } else {
            log.warn("Response has no identifier results to process");
        }
    }

    /**
     * Extract all consignments from IdentifiersResponseDto, converting ConsignmentApiDto to ConsignmentDto.
     */
    private List<ConsignmentDto> extractConsignmentsFromResponse(IdentifiersResponseDto response) {
        log.info("=== EXTRACT_CONSIGNMENTS_FROM_RESPONSE START ===");
        
        if (response.getIdentifiers() == null || response.getIdentifiers().isEmpty()) {
            log.info("Response has no identifiers, returning empty list");
            return new ArrayList<>();
        }
        
        log.info("Processing {} identifier results", response.getIdentifiers().size());
        
        List<ConsignmentDto> consignments = response.getIdentifiers().stream()
                .peek(result -> log.info("Processing identifier result: gateIndicator={}, status={}, consignments count={}", 
                    result.getGateIndicator(), result.getStatus(), 
                    result.getConsignments() != null ? result.getConsignments().size() : 0))
                .filter(result -> result.getConsignments() != null)
                .peek(result -> log.info("Identifier result passed filter, has {} consignments", result.getConsignments().size()))
                .flatMap(result -> result.getConsignments().stream())
                .peek(apiDto -> log.debug("Converting ConsignmentApiDto: platformId={}, datasetId={}, gateId={}", 
                    apiDto.getPlatformId(), apiDto.getDatasetId(), apiDto.getGateId()))
                .map(this::apiDtoToConsignmentDto)
                .collect(Collectors.toList());
        
        log.info("=== EXTRACT_CONSIGNMENTS_FROM_RESPONSE END: {} consignments extracted ===", consignments.size());
        return consignments;
    }

    /**
     * Convert ConsignmentApiDto to ConsignmentDto using MapperUtils.
     */
    private ConsignmentDto apiDtoToConsignmentDto(ConsignmentApiDto apiDto) {
        return getMapperUtils().apiDtoToConsignmentDto(apiDto);
    }

    /**
     * Find IdentifiersRequestDto by requestId.
     * Similar to UilRequestService.findByRequestId().
     */
    private Optional<IdentifiersRequestDto> findByRequestId(final String requestId) {
        final List<IdentifiersRequestEntity> entities = identifiersRequestRepository.findByControlRequestId(requestId);
        final Optional<IdentifiersRequestEntity> entity = entities.stream()
                .filter(e -> RequestStatusEnum.IN_PROGRESS.equals(e.getStatus()) || 
                            RequestStatusEnum.RECEIVED.equals(e.getStatus()))
                .findFirst();
        return entity.map(identifiersRequestEntity -> getMapperUtils().requestToRequestDto(identifiersRequestEntity, IdentifiersRequestDto.class));
    }
}
