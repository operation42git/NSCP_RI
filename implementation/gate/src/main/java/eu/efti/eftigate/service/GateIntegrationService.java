package eu.efti.eftigate.service;

import eu.efti.commons.dto.ControlDto;
import eu.efti.commons.dto.IdentifiersResponseDto;
import eu.efti.commons.dto.SearchParameter;
import eu.efti.commons.dto.SearchWithIdentifiersRequestDto;
import eu.efti.commons.dto.UilDto;
import eu.efti.commons.enums.RequestTypeEnum;
import eu.efti.commons.enums.StatusEnum;
import eu.efti.commons.utils.SerializeUtils;
import eu.efti.eftigate.config.GateProperties;
import eu.efti.eftigate.dto.RabbitRequestDto;
import eu.efti.eftigate.dto.RequestIdDto;
import eu.efti.eftigate.service.gate.EftiGateIdResolver;
import eu.efti.eftigate.service.request.IdentifiersRequestService;
import eu.efti.eftigate.service.request.UilRequestService;
import eu.efti.v1.consignment.common.SupplyChainConsignment;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Service
@Slf4j
public class GateIntegrationService {
    private final DomibusIntegrationService domibusIntegrationService;
    private final GateProperties gateProperties;
    private final GateRestService gateRestService;
    private final UilRequestService uilRequestService;
    private final IdentifiersRequestService identifiersRequestService;
    private final ControlService controlService;
    private final SerializeUtils serializeUtils;
    private final EftiGateIdResolver eftiGateIdResolver;

    private static final List<RequestTypeEnum> UIL_REQUEST_TYPES = List.of(
            RequestTypeEnum.EXTERNAL_UIL_SEARCH,
            RequestTypeEnum.LOCAL_UIL_SEARCH,
            RequestTypeEnum.EXTERNAL_ASK_UIL_SEARCH
    );

    private static final List<RequestTypeEnum> IDENTIFIER_REQUEST_TYPES = List.of(
            RequestTypeEnum.EXTERNAL_IDENTIFIERS_SEARCH,
            RequestTypeEnum.LOCAL_IDENTIFIERS_SEARCH,
            RequestTypeEnum.EXTERNAL_ASK_IDENTIFIERS_SEARCH
    );

    void handle(final RabbitRequestDto rabbitRequestDto) {
        String destinationGateId = rabbitRequestDto.getGateIdDest();
        RequestTypeEnum requestType = rabbitRequestDto.getControl().getRequestType();

        // Check if we should use REST API for this gate
        if (gateProperties.shouldUseRestApiForGate(destinationGateId)) {
            log.info("Using REST API for gate '{}' instead of Domibus", destinationGateId);
            handleViaRestApi(rabbitRequestDto, requestType);
        } else {
            // Fall back to Domibus
            log.debug("Using Domibus for gate '{}'", destinationGateId);
            domibusIntegrationService.trySendDomibus(rabbitRequestDto, requestType, destinationGateId);
        }
    }

    private void handleViaRestApi(RabbitRequestDto rabbitRequestDto, RequestTypeEnum requestType) {
        if (UIL_REQUEST_TYPES.contains(requestType)) {
            handleUilViaRestApi(rabbitRequestDto);
        } else if (IDENTIFIER_REQUEST_TYPES.contains(requestType)) {
            handleIdentifiersViaRestApi(rabbitRequestDto);
        } else {
            // For now, fall back to Domibus for other request types
            log.warn("REST API not yet implemented for request type '{}', falling back to Domibus", requestType);
            domibusIntegrationService.trySendDomibus(rabbitRequestDto, requestType, rabbitRequestDto.getGateIdDest());
        }
    }

    private void handleUilViaRestApi(RabbitRequestDto rabbitRequestDto) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        String destinationGateId = rabbitRequestDto.getGateIdDest();
        String requestId = controlDto.getRequestId();

        try {
            // Update request status to IN_PROGRESS before making REST call
            // This ensures manageRestResponseReceived() can find the request entity
            uilRequestService.manageRestRequestInProgress(requestId);

            // Build the UIL request for the remote gate
            UilDto uilDto = UilDto.builder()
                    .gateId(destinationGateId)
                    .datasetId(controlDto.getDatasetId())
                    .platformId(controlDto.getPlatformId())
                    .subsetIds(controlDto.getSubsetIds())
                    .build();

            log.info("Calling remote gate '{}' via REST API for UIL search: datasetId={}", 
                    destinationGateId, controlDto.getDatasetId());

            // Execute the REST call (this polls until complete)
            RequestIdDto result = gateRestService.executeUilSearch(destinationGateId, uilDto);

            // Process the result
            processUilRestResult(rabbitRequestDto, result);

        } catch (GateRestService.GateRestServiceException e) {
            log.error("Failed to execute UIL search via REST API on gate '{}': {}", 
                    destinationGateId, e.getMessage(), e);
            handleUilRestError(rabbitRequestDto, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during REST API UIL search on gate '{}': {}", 
                    destinationGateId, e.getMessage(), e);
            handleUilRestError(rabbitRequestDto, "Unexpected error: " + e.getMessage());
        }
    }

    private void processUilRestResult(RabbitRequestDto rabbitRequestDto, RequestIdDto result) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        String requestId = controlDto.getRequestId();

        if (result.getStatus() == StatusEnum.COMPLETE && result.getData() != null) {
            log.info("UIL search via REST completed successfully for requestId: {}", requestId);
            
            try {
                // Parse the XML consignment data from the response
                SupplyChainConsignment consignment = parseConsignmentFromData(result.getData());
                if (consignment != null) {
                    uilRequestService.manageRestResponseReceived(requestId, consignment);
                } else {
                    log.warn("Could not parse consignment data from response, but request was successful");
                    handleUilRestError(rabbitRequestDto, "Could not parse consignment data from response");
                }
            } catch (Exception e) {
                log.error("Failed to parse consignment data: {}", e.getMessage(), e);
                handleUilRestError(rabbitRequestDto, "Failed to parse consignment data: " + e.getMessage());
            }
            
        } else if (result.getStatus() == StatusEnum.ERROR) {
            log.error("UIL search via REST returned error for requestId: {}: {} - {}", 
                    requestId, result.getErrorCode(), result.getErrorDescription());
            handleUilRestError(rabbitRequestDto, result.getErrorDescription());
            
        } else if (result.getStatus() == StatusEnum.TIMEOUT) {
            log.warn("UIL search via REST timed out for requestId: {}", requestId);
            handleUilRestTimeout(rabbitRequestDto);
            
        } else {
            log.warn("UIL search via REST returned unexpected status '{}' for requestId: {}", 
                    result.getStatus(), requestId);
            // Treat as success if we have data, otherwise as error
            if (result.getData() != null) {
                try {
                    SupplyChainConsignment consignment = parseConsignmentFromData(result.getData());
                    if (consignment != null) {
                        uilRequestService.manageRestResponseReceived(requestId, consignment);
                    } else {
                        handleUilRestError(rabbitRequestDto, "Unexpected status with unparseable data: " + result.getStatus());
                    }
                } catch (Exception e) {
                    handleUilRestError(rabbitRequestDto, "Failed to parse data: " + e.getMessage());
                }
            } else {
                handleUilRestError(rabbitRequestDto, "Unexpected status: " + result.getStatus());
            }
        }
    }

    private SupplyChainConsignment parseConsignmentFromData(byte[] data) {
        if (data == null || data.length == 0) {
            return null;
        }
        
        try {
            String xmlData = new String(data, StandardCharsets.UTF_8);
            log.debug("Parsing consignment XML data: {} bytes", data.length);
            return serializeUtils.mapXmlStringToJaxbObject(xmlData, SupplyChainConsignment.class);
        } catch (Exception e) {
            log.error("Failed to parse consignment XML: {}", e.getMessage());
            throw new RuntimeException("Failed to parse consignment data", e);
        }
    }

    private void handleUilRestError(RabbitRequestDto rabbitRequestDto, String errorMessage) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        controlDto.setStatus(StatusEnum.ERROR);
        controlDto.setError(eu.efti.commons.dto.ErrorDto.builder()
                .errorCode("GATE_REST_ERROR")
                .errorDescription(errorMessage)
                .build());
        controlService.save(controlDto);
    }

    private void handleUilRestTimeout(RabbitRequestDto rabbitRequestDto) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        controlDto.setStatus(StatusEnum.TIMEOUT);
        controlService.save(controlDto);
    }

    private void handleIdentifiersViaRestApi(RabbitRequestDto rabbitRequestDto) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        String destinationGateId = rabbitRequestDto.getGateIdDest();
        String requestId = controlDto.getRequestId();

        try {
            // Build the identifier search request from ControlDto
            SearchWithIdentifiersRequestDto identifierRequest = buildIdentifierRequestFromControl(controlDto, destinationGateId);
            
            if (identifierRequest == null) {
                log.error("Cannot build identifier request from control - transportIdentifiers is null");
                handleIdentifiersRestError(rabbitRequestDto, "Missing identifier search parameters");
                return;
            }

            log.info("Calling remote gate '{}' via REST API for identifier search: identifier={}", 
                    destinationGateId, identifierRequest.getIdentifier());

            // Execute the REST call (this polls until complete)
            IdentifiersResponseDto result = gateRestService.executeIdentifierSearch(destinationGateId, identifierRequest);

            // Process the result
            processIdentifiersRestResult(rabbitRequestDto, result);

        } catch (GateRestService.GateRestServiceException e) {
            log.error("Failed to execute identifier search via REST API on gate '{}': {}", 
                    destinationGateId, e.getMessage(), e);
            handleIdentifiersRestError(rabbitRequestDto, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during REST API identifier search on gate '{}': {}", 
                    destinationGateId, e.getMessage(), e);
            handleIdentifiersRestError(rabbitRequestDto, "Unexpected error: " + e.getMessage());
        }
    }

    private SearchWithIdentifiersRequestDto buildIdentifierRequestFromControl(ControlDto controlDto, String destinationGateId) {
        SearchParameter searchParameter = controlDto.getTransportIdentifiers();
        if (searchParameter == null) {
            return null;
        }

        // IMPORTANT: prevent remote gates from re-orchestrating/fanning out.
        // When a gate calls another gate via REST, the destination gate must only search locally.
        // We achieve this by explicitly scoping the request to the destination country's indicator.
        // Example: calling gateId "slovenia" -> eftiGateIndicator ["SI"].
        final String destinationCountryIndicator = eftiGateIdResolver.resolve(destinationGateId);
        if (destinationCountryIndicator == null) {
            log.warn("Could not resolve destination country indicator for gateId '{}'; remote gate may fan out unexpectedly", destinationGateId);
        }

        return SearchWithIdentifiersRequestDto.builder()
                .identifier(searchParameter.getIdentifier())
                .identifierType(searchParameter.getIdentifierType())
                .dangerousGoodsIndicator(searchParameter.getDangerousGoodsIndicator())
                .modeCode(searchParameter.getModeCode())
                .registrationCountryCode(searchParameter.getRegistrationCountryCode())
                .eftiGateIndicator(destinationCountryIndicator != null ? List.of(destinationCountryIndicator) : null)
                .build();
    }

    private void processIdentifiersRestResult(RabbitRequestDto rabbitRequestDto, IdentifiersResponseDto result) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        String requestId = controlDto.getRequestId();

        if (result.getStatus() == StatusEnum.COMPLETE) {
            log.info("Identifier search via REST completed successfully for requestId: {}", requestId);
            
            // Process the identifier results
            if (result.getIdentifiers() != null && !result.getIdentifiers().isEmpty()) {
                identifiersRequestService.manageRestResponseReceived(requestId, result);
            } else {
                log.info("Identifier search returned no results for requestId: {}", requestId);
                identifiersRequestService.manageRestResponseReceived(requestId, result);
            }
            
        } else if (result.getStatus() == StatusEnum.ERROR) {
            log.error("Identifier search via REST returned error for requestId: {}: {} - {}", 
                    requestId, result.getErrorCode(), result.getErrorDescription());
            handleIdentifiersRestError(rabbitRequestDto, result.getErrorDescription());
            
        } else if (result.getStatus() == StatusEnum.TIMEOUT) {
            log.warn("Identifier search via REST timed out for requestId: {}", requestId);
            handleIdentifiersRestTimeout(rabbitRequestDto);
            
        } else {
            log.warn("Identifier search via REST returned unexpected status '{}' for requestId: {}", 
                    result.getStatus(), requestId);
            // Treat as success if we have results, otherwise as error
            if (result.getIdentifiers() != null) {
                identifiersRequestService.manageRestResponseReceived(requestId, result);
            } else {
                handleIdentifiersRestError(rabbitRequestDto, "Unexpected status: " + result.getStatus());
            }
        }
    }

    private void handleIdentifiersRestError(RabbitRequestDto rabbitRequestDto, String errorMessage) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        controlDto.setStatus(StatusEnum.ERROR);
        controlDto.setError(eu.efti.commons.dto.ErrorDto.builder()
                .errorCode("GATE_REST_ERROR")
                .errorDescription(errorMessage)
                .build());
        controlService.save(controlDto);
    }

    private void handleIdentifiersRestTimeout(RabbitRequestDto rabbitRequestDto) {
        ControlDto controlDto = rabbitRequestDto.getControl();
        controlDto.setStatus(StatusEnum.TIMEOUT);
        controlService.save(controlDto);
    }
}
