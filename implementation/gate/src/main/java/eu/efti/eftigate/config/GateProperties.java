package eu.efti.eftigate.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GateProperties {
    private String country;
    private String owner;
    private ApConfig ap;
    private List<PlatformProperties> platforms;
    private List<RemoteGateProperties> remoteGates;

    @Data
    @Builder
    public static final class ApConfig {
        private String url;
        private String username;
        private String password;
    }

    @Builder
    public record PlatformProperties(String platformId, Boolean useRestApi, URI restApiBaseUrl) {
        public PlatformProperties {
            if (useRestApi == null) {
                useRestApi = false;
            }
            if (useRestApi) {
                if (restApiBaseUrl == null) {
                    throw new IllegalArgumentException("restApiBaseUrl must not be null");
                }
            } else if (restApiBaseUrl != null) {
                throw new IllegalArgumentException("restApiBaseUrl must be null");
            }
        }
    }

    /**
     * Configuration for remote gates that can be accessed via direct REST API instead of Domibus.
     */
    @Builder
    public record RemoteGateProperties(
            String gateId,           // The gate identifier (e.g., "borduria", "syldavia")
            Boolean useRestApi,      // Whether to use REST API instead of Domibus
            URI restApiBaseUrl,      // Base URL for the gate's REST API (e.g., "http://gate.borduria.eu:8080")
            String username,         // Optional: Basic auth username
            String password          // Optional: Basic auth password
    ) {
        public RemoteGateProperties {
            if (useRestApi == null) {
                useRestApi = false;
            }
            if (useRestApi) {
                if (restApiBaseUrl == null) {
                    throw new IllegalArgumentException("restApiBaseUrl must not be null when useRestApi is true");
                }
            }
        }
    }

    public boolean isCurrentGate(final String gateId) {
        return this.owner.equalsIgnoreCase(gateId);
    }

    /**
     * Find remote gate configuration by gate ID.
     */
    public Optional<RemoteGateProperties> findRemoteGate(final String gateId) {
        if (remoteGates == null) {
            return Optional.empty();
        }
        return remoteGates.stream()
                .filter(g -> g.gateId() != null && g.gateId().equalsIgnoreCase(gateId))
                .findFirst();
    }

    /**
     * Check if a remote gate should use REST API.
     */
    public boolean shouldUseRestApiForGate(final String gateId) {
        return findRemoteGate(gateId)
                .map(RemoteGateProperties::useRestApi)
                .orElse(false);
    }
}
