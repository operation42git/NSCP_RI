package eu.efti.platformgatesimulator.service;

import eu.efti.platformgatesimulator.config.GateProperties;
import eu.efti.platformgatesimulator.entity.ConsignmentXml;
import eu.efti.platformgatesimulator.exception.UploadException;
import eu.efti.platformgatesimulator.repository.ConsignmentXmlRepository;
import eu.efti.v1.consignment.common.SupplyChainConsignment;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

class ReaderServiceTest {

    AutoCloseable openMocks;

    private ReaderService readerService;

    private ResourceLoader resourceLoader;
    
    private ConsignmentXmlRepository consignmentXmlRepository;

    @BeforeEach
    public void before() {
        resourceLoader = Mockito.mock(ResourceLoader.class);
        consignmentXmlRepository = Mockito.mock(ConsignmentXmlRepository.class);
        openMocks = MockitoAnnotations.openMocks(this);
        final GateProperties gateProperties = GateProperties.builder()
                .owner("france")
                .minSleep(1000)
                .maxSleep(2000)
                .cdaPath("classpath:cda/")
                .ap(GateProperties.ApConfig.builder()
                        .url("url")
                        .password("password")
                        .username("username").build()).build();
        readerService = new ReaderService(gateProperties, resourceLoader, consignmentXmlRepository);
    }

    @AfterEach
    void tearDown() throws Exception {
        openMocks.close();
    }

    @Test
    void uploadFileNullTest() {
        assertThrows(NullPointerException.class, () -> readerService.uploadFile(null));
    }

    @Test
    void uploadFileTest() throws IOException, UploadException {
        // Setup mock to return saved entity
        Mockito.when(consignmentXmlRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        
        final MockMultipartFile mockMultipartFile = new MockMultipartFile(
                "teest.xml",
                "teest.xml",
                "text/plain",
                "content".getBytes());

        // Should not throw - saves to database now
        readerService.uploadFile(mockMultipartFile);
        
        // Verify save was called
        Mockito.verify(consignmentXmlRepository).save(any(ConsignmentXml.class));
    }

    @Test
    void readFromFileXmlFromDatabaseTest() throws IOException {
        final String data = """
                <consignment xmlns="http://efti.eu/v1/consignment/common"
                             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                             xsi:schemaLocation="http://efti.eu/v1/consignment/common ../consignment-common.xsd">
                </consignment>
                """;
        
        // Mock database lookup - found in database
        ConsignmentXml consignmentXml = ConsignmentXml.builder()
                .datasetId("teest")
                .xmlContent(data)
                .build();
        Mockito.when(consignmentXmlRepository.findByDatasetId("teest")).thenReturn(Optional.of(consignmentXml));
        
        final SupplyChainConsignment result = readerService.readFromFile("teest", List.of("full"));

        Assertions.assertNotNull(result);
    }

    @Test
    void readFromFileXmlFallbackToFileTest() throws IOException {
        final String data = """
                <consignment xmlns="http://efti.eu/v1/consignment/common"
                             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                             xsi:schemaLocation="http://efti.eu/v1/consignment/common ../consignment-common.xsd">
                </consignment>
                """;
        
        // Mock database lookup - not found in database
        Mockito.when(consignmentXmlRepository.findByDatasetId(anyString())).thenReturn(Optional.empty());
        
        // Mock file system fallback
        final Resource resource = Mockito.mock(Resource.class);
        Mockito.when(resourceLoader.getResource(any())).thenReturn(resource);
        Mockito.when(resource.exists()).thenReturn(true);
        Mockito.when(resource.getContentAsString(any())).thenReturn(data);
        
        final SupplyChainConsignment result = readerService.readFromFile("teest", List.of("full"));

        Assertions.assertNotNull(result);
    }

    @Test
    void readFromFileXmlNullTest() throws IOException {
        // Mock database lookup - not found
        Mockito.when(consignmentXmlRepository.findByDatasetId(anyString())).thenReturn(Optional.empty());
        
        // Mock file system fallback - also not found
        final Resource resource = Mockito.mock(Resource.class);
        Mockito.when(resourceLoader.getResource(any())).thenReturn(resource);
        Mockito.when(resource.exists()).thenReturn(false);
        
        final SupplyChainConsignment result = readerService.readFromFile("bouuuuuuuuuuuuh", List.of("full"));

        Assertions.assertNull(result);
    }
}
