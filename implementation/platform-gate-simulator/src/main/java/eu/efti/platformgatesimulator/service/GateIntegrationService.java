package eu.efti.platformgatesimulator.service;

import eu.efti.commons.utils.EftiSchemaUtils;
import eu.efti.commons.utils.SerializeUtils;
import eu.efti.platformgatesimulator.config.GateProperties;
import eu.efti.platformgatesimulator.service.ApiClient;
import eu.efti.platformgatesimulator.service.client.DefaultApi;
import eu.efti.platformgatesimulator.utils.StringAsObjectHttpMessageConverter;
import eu.efti.v1.consignment.identifier.SupplyChainConsignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;

@Service
@Slf4j
public class GateIntegrationService {
    public static class GateIntegrationServiceException extends Exception {
        public GateIntegrationServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private final DefaultApi api;

    private final GateProperties gateProperties;

    private final SerializeUtils serializeUtils;

    @Autowired
    public GateIntegrationService(GateProperties gateProperties,
                                  SerializeUtils serializeUtils) {
        this.gateProperties = gateProperties;
        this.serializeUtils = serializeUtils;
        // Create RestTemplate with StringAsObjectHttpMessageConverter to handle raw XML string writing
        // This must be first so it intercepts Object writes (when value is String) before Jackson XML tries to serialize
        RestTemplate restTemplate = new RestTemplateBuilder().build();
        var converters = new ArrayList<>(restTemplate.getMessageConverters());
        converters.add(0, new StringAsObjectHttpMessageConverter());
        restTemplate.setMessageConverters(converters);
        // Create ApiClient with the configured RestTemplate
        var apiClient = new ApiClient(restTemplate)
                .setBasePath(gateProperties.getRestApiBaseUrl().toString());
        // Set authentication headers for HTTPD to transform to X-Pre-Authenticated-* headers
        apiClient.addDefaultHeader("X-Mock-Pre-Authenticated-User-Id", gateProperties.getOwner());
        apiClient.addDefaultHeader("X-Mock-Pre-Authenticated-User-Role", "PLATFORM");
        api = new DefaultApi(apiClient);
    }

    public URI getRestApiBaseUrl() {
        return gateProperties.getRestApiBaseUrl();
    }

    public String callWhoami() throws GateIntegrationServiceException {
        try {
            return api.getWhoami().getAppId();
        } catch (HttpClientErrorException e) {
            throw new GateIntegrationServiceException(e.getClass().getSimpleName() + ": " + e.getMessage(), e);
        }
    }

    public void uploadIdentifiers(String datasetId, SupplyChainConsignment consignmentIdentifiers) throws GateIntegrationServiceException {
        try {
            log.info("Uploading identifiers for dataset ID: {}", datasetId);
            var doc = EftiSchemaUtils.mapIdentifiersObjectToDoc(serializeUtils, consignmentIdentifiers);
            var xml = serializeUtils.mapDocToXmlString(doc);
            
            // Log XML content for debugging (first 500 chars)
            String preview = xml.length() > 500 ? xml.substring(0, 500) + "..." : xml;
            log.debug("Sending XML to gate (length: {} chars, preview: {})", xml.length(), preview);
            
            api.putConsignmentIdentifiers(datasetId, xml);
            log.info("Successfully uploaded identifiers for dataset ID: {}", datasetId);
        } catch (HttpClientErrorException e) {
            log.error("HTTP error uploading identifiers for dataset ID {}: Status={}, Response={}", 
                    datasetId, e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new GateIntegrationServiceException(e.getClass().getSimpleName() + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error uploading identifiers for dataset ID: {}", datasetId, e);
            throw new GateIntegrationServiceException("Unexpected error: " + e.getMessage(), e);
        }
    }
}
