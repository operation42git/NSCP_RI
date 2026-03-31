package eu.efti.platformgatesimulator.service;

import eu.efti.commons.exception.TechnicalException;
import eu.efti.platformgatesimulator.config.GateProperties;
import eu.efti.platformgatesimulator.entity.ConsignmentXml;
import eu.efti.platformgatesimulator.exception.UploadException;
import eu.efti.platformgatesimulator.repository.ConsignmentXmlRepository;
import eu.efti.platformgatesimulator.utils.SubsetUtils;
import eu.efti.v1.consignment.common.ObjectFactory;
import eu.efti.v1.consignment.common.SupplyChainConsignment;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBElement;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.InputSource;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReaderService {
    public static final String XML_FILE_TYPE = "xml";
    public static final String JSON_FILE_TYPE = "json";
    private final GateProperties gateProperties;
    private final ResourceLoader resourceLoader;
    private final ConsignmentXmlRepository consignmentXmlRepository;

    public void uploadFile(final MultipartFile file) throws UploadException {
        uploadFile(file, file.getOriginalFilename());
    }

    public void uploadFile(final MultipartFile file, final String filenameOverride) throws UploadException {
        try {
            if (file == null) {
                throw new NullPointerException("No file send");
            }
            
            // Read file content and save to database
            String xmlContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            saveXmlContent(filenameOverride, xmlContent);
        } catch (final IOException e) {
            log.error("Error when try to save file to database", e);
            throw new UploadException(e);
        }
    }
    
    /**
     * Save XML content directly to the database.
     * Use this method when you already have the XML content as a string.
     */
    public void saveXmlContent(final String filename, final String xmlContent) {
        // Extract dataset ID from filename (remove .xml extension)
        String datasetId = filename;
        if (datasetId.endsWith(".xml")) {
            datasetId = datasetId.substring(0, datasetId.length() - 4);
        }
        
        log.info("Saving consignment XML to database with dataset ID: {}", datasetId);
        
        ConsignmentXml consignmentXml = ConsignmentXml.builder()
                .datasetId(datasetId)
                .xmlContent(xmlContent)
                .build();
        
        consignmentXmlRepository.save(consignmentXml);
        
        log.info("Consignment XML saved to database with dataset ID: {}", datasetId);
    }

    @SuppressWarnings("unchecked")
    public SupplyChainConsignment readFromFile(final String pathOrDatasetId, final List<String> subsets) throws IOException {
        // Extract datasetId from path if a full path is provided (e.g., "file:/usr/src/myapp/cda/12345678-...")
        // Otherwise use the parameter as-is if it's already just a datasetId
        String datasetId = extractDatasetIdFromPath(pathOrDatasetId);
        
        log.info("Reading consignment for dataset ID: {} (from path: {})", datasetId, pathOrDatasetId);
        
        // First try to read from database
        Optional<ConsignmentXml> consignmentXmlOpt = consignmentXmlRepository.findByDatasetId(datasetId);
        
        String xmlContent = null;
        
        if (consignmentXmlOpt.isPresent()) {
            log.info("Found consignment XML in database for dataset ID: {}", datasetId);
            xmlContent = consignmentXmlOpt.get().getXmlContent();
        } else {
            // Fallback to file system for backward compatibility
            log.info("Dataset not found in database, trying file system for: {}", pathOrDatasetId);
            Resource resource = tryOpenFile(pathOrDatasetId, XML_FILE_TYPE);
            if (resource.exists()) {
                log.info("Found file on file system");
                xmlContent = resource.getContentAsString(Charset.defaultCharset());
            } else {
                log.info("Dataset not found in database or file system: {}", datasetId);
                return null;
            }
        }
        
        Optional<String> str;
        if (subsets.isEmpty() || subsets.contains("full")) {
            str = Optional.of(xmlContent);
        } else {
            str = SubsetUtils.parseBySubsets(xmlContent, subsets);
        }
        
        if (str.isEmpty()) {
            return null;
        }
        
        try {
            final Unmarshaller unmarshaller = JAXBContext.newInstance(ObjectFactory.class).createUnmarshaller();
            final JAXBElement<SupplyChainConsignment> jaxbElement = (JAXBElement<SupplyChainConsignment>) unmarshaller.unmarshal(new InputSource(new StringReader(str.get())));
            return jaxbElement.getValue();
        } catch (JAXBException e) {
            throw new TechnicalException("error while writing content", e);
        }
    }

    /**
     * Extracts the datasetId from a path string.
     * Handles both full paths (e.g., "file:/usr/src/myapp/cda/12345678-...") and plain datasetIds.
     * 
     * @param pathOrDatasetId The full path or just the datasetId
     * @return The extracted datasetId (UUID format)
     */
    private String extractDatasetIdFromPath(final String pathOrDatasetId) {
        if (pathOrDatasetId == null || pathOrDatasetId.isEmpty()) {
            return pathOrDatasetId;
        }
        
        String result = pathOrDatasetId;
        
        // Remove the cdaPath prefix if present (e.g., "file:/usr/src/myapp/cda/")
        String cdaPath = gateProperties.getCdaPath();
        if (cdaPath != null && result.startsWith(cdaPath)) {
            result = result.substring(cdaPath.length());
        }
        
        // Remove leading/trailing slashes
        result = result.replaceAll("^[/\\\\]+|[/\\\\]+$", "");
        
        // Remove .xml extension if present
        if (result.endsWith(".xml")) {
            result = result.substring(0, result.length() - 4);
        }
        
        // Extract UUID pattern (8-4-4-4-12 format) if the path contains it
        // This handles cases where there might be additional path components
        java.util.regex.Pattern uuidPattern = java.util.regex.Pattern.compile(
            "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
        );
        java.util.regex.Matcher matcher = uuidPattern.matcher(result);
        if (matcher.find()) {
            result = matcher.group();
        }
        
        return result;
    }

    private Resource tryOpenFile(final String path, final String ext) {
        final String filePath = String.join(".", path, ext);
        log.info("try to open file : {}", filePath);
        return resourceLoader.getResource(filePath);
    }
}
