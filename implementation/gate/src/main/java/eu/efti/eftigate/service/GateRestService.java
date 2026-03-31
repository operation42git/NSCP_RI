package eu.efti.eftigate.service;

import eu.efti.commons.dto.IdentifiersResponseDto;
import eu.efti.commons.dto.SearchWithIdentifiersRequestDto;
import eu.efti.commons.dto.UilDto;
import eu.efti.commons.enums.StatusEnum;
import eu.efti.eftigate.config.GateProperties;
import eu.efti.eftigate.dto.RequestIdDto;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;

import java.net.URI;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

/**
 * Service for direct REST API communication with remote gates.
 * This bypasses Domibus and calls the remote gate's REST endpoints directly.
 */
@AllArgsConstructor
@Service
@Slf4j
public class GateRestService {

    private final GateProperties gateProperties;

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_POLL_ATTEMPTS = 30;
    private static final Duration POLL_INTERVAL = Duration.ofSeconds(2);

    /**
     * Execute a UIL search on a remote gate via REST API.
     * This is a synchronous call that:
     * 1. POSTs to /v1/control/uil to initiate the search
     * 2. Polls GET /v1/control/uil?requestId=xxx until complete or timeout
     * 
     * @param gateId The destination gate ID
     * @param uilDto The UIL search request
     * @return The final RequestIdDto with data or error
     * @throws GateRestServiceException if communication fails
     */
    public RequestIdDto executeUilSearch(String gateId, UilDto uilDto) throws GateRestServiceException {
        GateProperties.RemoteGateProperties remoteGate = gateProperties.findRemoteGate(gateId)
                .orElseThrow(() -> new GateRestServiceException("No REST configuration found for gate: " + gateId));

        RestTemplate restTemplate = createRestTemplate(remoteGate);
        URI baseUrl = remoteGate.restApiBaseUrl();

        log.info("Executing UIL search on remote gate '{}' via REST API: {}", gateId, baseUrl);

        // Step 1: POST to initiate the UIL search
        RequestIdDto initiationResponse = postUilSearch(restTemplate, baseUrl, uilDto);
        String requestId = initiationResponse.getRequestId();
        
        if (requestId == null) {
            log.error("Remote gate returned null requestId");
            throw new GateRestServiceException("Remote gate did not return a requestId");
        }

        log.info("Remote gate accepted UIL search, requestId: {}", requestId);

        // Step 2: Poll for result
        return pollForUilResult(restTemplate, baseUrl, requestId);
    }

    /**
     * Execute an identifier search on a remote gate via REST API.
     * This is a synchronous call that:
     * 1. POSTs to /v1/control/identifiers to initiate the search
     * 2. Polls GET /v1/control/identifiers?requestId=xxx until complete or timeout
     * 
     * @param gateId The destination gate ID
     * @param request The identifier search request
     * @return The final IdentifiersResponseDto with data or error
     * @throws GateRestServiceException if communication fails
     */
    public IdentifiersResponseDto executeIdentifierSearch(String gateId, SearchWithIdentifiersRequestDto request) throws GateRestServiceException {
        GateProperties.RemoteGateProperties remoteGate = gateProperties.findRemoteGate(gateId)
                .orElseThrow(() -> new GateRestServiceException("No REST configuration found for gate: " + gateId));

        RestTemplate restTemplate = createRestTemplate(remoteGate);
        URI baseUrl = remoteGate.restApiBaseUrl();

        log.info("Executing identifier search on remote gate '{}' via REST API: {}", gateId, baseUrl);

        // Step 1: POST to initiate the identifier search
        RequestIdDto initiationResponse = postIdentifierSearch(restTemplate, baseUrl, request);
        String requestId = initiationResponse.getRequestId();
        
        if (requestId == null) {
            log.error("Remote gate returned null requestId");
            throw new GateRestServiceException("Remote gate did not return a requestId");
        }

        log.info("Remote gate accepted identifier search, requestId: {}", requestId);

        // Step 2: Poll for result
        return pollForIdentifierResult(restTemplate, baseUrl, requestId);
    }

    private RequestIdDto postUilSearch(RestTemplate restTemplate, URI baseUrl, UilDto uilDto) 
            throws GateRestServiceException {
        String url = baseUrl.toString() + "/v1/control/uil";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        // Add header-based authentication for gate-to-gate calls
        headers.set("X-Pre-Authenticated-User-Id", "gate-service");
        headers.set("X-Pre-Authenticated-User-Role", "ROAD_CONTROLER");
        
        HttpEntity<UilDto> request = new HttpEntity<>(uilDto, headers);

        try {
            log.debug("POST {} with body: {}", url, uilDto);
            ResponseEntity<RequestIdDto> response = restTemplate.exchange(
                    url, 
                    HttpMethod.POST, 
                    request, 
                    RequestIdDto.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new GateRestServiceException("Unexpected response status: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            log.error("HTTP client error calling remote gate: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new GateRestServiceException("Remote gate returned error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (HttpServerErrorException e) {
            log.error("HTTP server error from remote gate: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new GateRestServiceException("Remote gate server error: " + e.getStatusCode(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection error to remote gate: {}", e.getMessage());
            throw new GateRestServiceException("Connection error to remote gate: " + e.getMessage(), e);
        } catch (RestClientException e) {
            log.error("REST client error: {}", e.getMessage());
            throw new GateRestServiceException("REST client error: " + e.getMessage(), e);
        }
    }

    private RequestIdDto postIdentifierSearch(RestTemplate restTemplate, URI baseUrl, SearchWithIdentifiersRequestDto request) 
            throws GateRestServiceException {
        String url = baseUrl.toString() + "/v1/control/identifiers";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        // Add header-based authentication for gate-to-gate calls
        headers.set("X-Pre-Authenticated-User-Id", "gate-service");
        headers.set("X-Pre-Authenticated-User-Role", "ROAD_CONTROLER");
        
        HttpEntity<SearchWithIdentifiersRequestDto> httpRequest = new HttpEntity<>(request, headers);

        try {
            log.debug("POST {} with body: {}", url, request);
            ResponseEntity<RequestIdDto> response = restTemplate.exchange(
                    url, 
                    HttpMethod.POST, 
                    httpRequest, 
                    RequestIdDto.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new GateRestServiceException("Unexpected response status: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            log.error("HTTP client error calling remote gate: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new GateRestServiceException("Remote gate returned error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (HttpServerErrorException e) {
            log.error("HTTP server error from remote gate: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new GateRestServiceException("Remote gate server error: " + e.getStatusCode(), e);
        } catch (ResourceAccessException e) {
            log.error("Connection error to remote gate: {}", e.getMessage());
            throw new GateRestServiceException("Connection error to remote gate: " + e.getMessage(), e);
        } catch (RestClientException e) {
            log.error("REST client error: {}", e.getMessage());
            throw new GateRestServiceException("REST client error: " + e.getMessage(), e);
        }
    }

    private RequestIdDto pollForUilResult(RestTemplate restTemplate, URI baseUrl, String requestId) 
            throws GateRestServiceException {
        String url = baseUrl.toString() + "/v1/control/uil?requestId=" + requestId;

        for (int attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
            try {
                log.debug("Polling attempt {}/{}: GET {}", attempt, MAX_POLL_ATTEMPTS, url);
                
                HttpHeaders headers = new HttpHeaders();
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                // Add header-based authentication for gate-to-gate calls
                headers.set("X-Pre-Authenticated-User-Id", "gate-service");
                headers.set("X-Pre-Authenticated-User-Role", "ROAD_CONTROLER");
                HttpEntity<Void> request = new HttpEntity<>(headers);

                ResponseEntity<RequestIdDto> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        request,
                        RequestIdDto.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    RequestIdDto result = response.getBody();
                    
                    if (result.getStatus() != null) {
                        String status = result.getStatus().name();
                        log.debug("Remote gate response status: {}", status);
                        
                        // Check if the request is complete
                        if ("COMPLETE".equalsIgnoreCase(status) || 
                            "ERROR".equalsIgnoreCase(status) || 
                            "TIMEOUT".equalsIgnoreCase(status)) {
                            log.info("UIL search completed on remote gate with status: {}", status);
                            return result;
                        }
                    }
                }

                // Wait before next poll
                if (attempt < MAX_POLL_ATTEMPTS) {
                    Thread.sleep(POLL_INTERVAL.toMillis());
                }

            } catch (HttpClientErrorException e) {
                log.error("HTTP client error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Error polling remote gate: " + e.getMessage(), e);
            } catch (HttpServerErrorException e) {
                log.error("HTTP server error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Remote gate server error: " + e.getMessage(), e);
            } catch (ResourceAccessException e) {
                log.error("Connection error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Connection error: " + e.getMessage(), e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new GateRestServiceException("Polling interrupted", e);
            } catch (RestClientException e) {
                log.error("REST client error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("REST client error: " + e.getMessage(), e);
            }
        }

        log.warn("Polling timed out after {} attempts for requestId: {}", MAX_POLL_ATTEMPTS, requestId);
        throw new GateRestServiceException("Polling timed out waiting for remote gate response");
    }

    private IdentifiersResponseDto pollForIdentifierResult(RestTemplate restTemplate, URI baseUrl, String requestId) 
            throws GateRestServiceException {
        String url = baseUrl.toString() + "/v1/control/identifiers?requestId=" + requestId;

        for (int attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
            try {
                log.debug("Polling attempt {}/{}: GET {}", attempt, MAX_POLL_ATTEMPTS, url);
                
                HttpHeaders headers = new HttpHeaders();
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                // Add header-based authentication for gate-to-gate calls
                headers.set("X-Pre-Authenticated-User-Id", "gate-service");
                headers.set("X-Pre-Authenticated-User-Role", "ROAD_CONTROLER");
                HttpEntity<Void> httpRequest = new HttpEntity<>(headers);

                ResponseEntity<IdentifiersResponseDto> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        httpRequest,
                        IdentifiersResponseDto.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    IdentifiersResponseDto result = response.getBody();
                    
                    if (result.getStatus() != null) {
                        StatusEnum status = result.getStatus();
                        log.debug("Remote gate response status: {}", status);
                        
                        // Check if the request is complete
                        if (status == StatusEnum.COMPLETE || 
                            status == StatusEnum.ERROR || 
                            status == StatusEnum.TIMEOUT) {
                            log.info("Identifier search completed on remote gate with status: {}", status);
                            return result;
                        }
                    }
                }

                // Wait before next poll
                if (attempt < MAX_POLL_ATTEMPTS) {
                    Thread.sleep(POLL_INTERVAL.toMillis());
                }

            } catch (HttpClientErrorException e) {
                log.error("HTTP client error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Error polling remote gate: " + e.getMessage(), e);
            } catch (HttpServerErrorException e) {
                log.error("HTTP server error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Remote gate server error: " + e.getMessage(), e);
            } catch (ResourceAccessException e) {
                log.error("Connection error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("Connection error: " + e.getMessage(), e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new GateRestServiceException("Polling interrupted", e);
            } catch (RestClientException e) {
                log.error("REST client error polling remote gate: {}", e.getMessage());
                throw new GateRestServiceException("REST client error: " + e.getMessage(), e);
            }
        }

        log.warn("Polling timed out after {} attempts for requestId: {}", MAX_POLL_ATTEMPTS, requestId);
        throw new GateRestServiceException("Polling timed out waiting for remote gate response");
    }

    private RestTemplate createRestTemplate(GateProperties.RemoteGateProperties remoteGate) {
        RestTemplateBuilder builder = new RestTemplateBuilder()
                .setConnectTimeout(CONNECT_TIMEOUT)
                .setReadTimeout(READ_TIMEOUT);

        // Add basic auth if configured
        if (remoteGate.username() != null && remoteGate.password() != null) {
            builder = builder.basicAuthentication(remoteGate.username(), remoteGate.password());
        }

        return builder.build();
    }

    /**
     * Exception thrown when REST communication with a remote gate fails.
     */
    public static class GateRestServiceException extends Exception {
        public GateRestServiceException(String message) {
            super(message);
        }

        public GateRestServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

