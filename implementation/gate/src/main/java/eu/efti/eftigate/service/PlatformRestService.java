package eu.efti.eftigate.service;

import eu.efti.commons.utils.MappingException;
import eu.efti.commons.utils.SerializeUtils;
import eu.efti.eftigate.service.ApiClient;
import eu.efti.eftigate.service.client.DefaultApi;
import eu.efti.eftigate.service.request.ValidationService;
import eu.efti.eftigate.utils.StringAsObjectHttpMessageConverter;
import eu.efti.v1.consignment.common.SupplyChainConsignment;
import lombok.AllArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Set;

@AllArgsConstructor
@Service
public class PlatformRestService {
    // Configure RestTemplate with timeouts to prevent hanging requests
    // Connect timeout: 5 seconds, Read timeout: 30 seconds
    private static final RestTemplate restTemplate = new RestTemplateBuilder()
            .messageConverters(new StringAsObjectHttpMessageConverter())
            .setConnectTimeout(java.time.Duration.ofSeconds(5))
            .setReadTimeout(java.time.Duration.ofSeconds(30))
            .build();

    private final SerializeUtils serializeUtils;

    private final ValidationService validationService;

    private static DefaultApi createApi(URI restApiBaseUrl) {
        // TODO EREF-72: include authentication info
        return new DefaultApi(new ApiClient(restTemplate)
                .setBasePath(restApiBaseUrl.toString()));
    }

    public PlatformRestClient getClient(URI restApiBaseUrl) {
        return new PlatformRestClient(createApi(restApiBaseUrl));
    }

    @AllArgsConstructor
    public class PlatformRestClient {
        private final DefaultApi api;

        public SupplyChainConsignment callGetConsignmentSubsets(String datasetId, Set<String> subsetIds) throws PlatformIntegrationServiceException {
            try {
                var xml = (String) api.getConsignmentSubsets(datasetId, subsetIds);
                return serializeUtils.mapXmlStringToJaxbObject(xml, SupplyChainConsignment.class, validationService.getGateSchema());
            } catch (MappingException e) {
                throw new PlatformIntegrationServiceException("Got invalid content from platform", e);
            } catch (HttpClientErrorException | HttpServerErrorException e) {
                throw new PlatformIntegrationServiceException(e.getClass().getSimpleName() + ": " + e.getMessage(), e);
            } catch (ResourceAccessException e) {
                throw new PlatformIntegrationServiceException("Connection error: " + e.getMessage(), e);
            } catch (RestClientException e) {
                throw new PlatformIntegrationServiceException("REST client error: " + e.getMessage(), e);
            }
        }

        public void callPostConsignmentFollowup(String datasetId, String body) throws PlatformIntegrationServiceException {
            try {
                api.postConsignmentFollowup(datasetId, body);
            } catch (HttpClientErrorException | HttpServerErrorException e) {
                throw new PlatformIntegrationServiceException(e.getClass().getSimpleName() + ": " + e.getMessage(), e);
            } catch (ResourceAccessException e) {
                throw new PlatformIntegrationServiceException("Connection error: " + e.getMessage(), e);
            } catch (RestClientException e) {
                throw new PlatformIntegrationServiceException("REST client error: " + e.getMessage(), e);
            }
        }
    }
}
