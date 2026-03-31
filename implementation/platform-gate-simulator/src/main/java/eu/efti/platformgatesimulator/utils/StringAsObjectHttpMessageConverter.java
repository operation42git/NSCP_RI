package eu.efti.platformgatesimulator.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Custom HTTP message converter that allows String objects to be sent as raw content
 * without being wrapped in XML serialization (e.g., avoiding &lt;String&gt;...&lt;/String&gt;).
 * This is needed when sending raw XML strings through the generated OpenAPI client.
 * 
 * Note: This converter only supports WRITING Object types (when the body is a String).
 * Reading/deserialization of Object types is NOT supported to avoid interfering with
 * other converters that handle XML/JSON deserialization into POJOs.
 */
@Slf4j
public class StringAsObjectHttpMessageConverter extends AbstractHttpMessageConverter<Object> {
    private static final Set<Class<?>> WRITE_SUPPORT = Set.of(String.class, Object.class);
    private static final Set<Class<?>> READ_SUPPORT = Set.of(String.class);

    public StringAsObjectHttpMessageConverter() {
        super(StandardCharsets.UTF_8, MediaType.APPLICATION_XML);
    }

    @Override
    protected boolean supports(@NonNull Class<?> clazz) {
        return WRITE_SUPPORT.contains(clazz);
    }

    @Override
    protected boolean canRead(@NonNull MediaType mediaType) {
        // Only read String.class, not Object.class - let other converters handle POJOs
        return super.canRead(mediaType);
    }

    @Override
    protected boolean canWrite(@NonNull MediaType mediaType) {
        // Support writing String and Object (when the actual value is a String)
        return MediaType.APPLICATION_XML.isCompatibleWith(mediaType);
    }

    @Override
    protected Object readInternal(@NonNull Class<? extends Object> clazz, @NonNull HttpInputMessage inputMessage) throws IOException {
        // Only support reading String, delegate to StringHttpMessageConverter logic
        if (clazz == String.class) {
            byte[] bytes = inputMessage.getBody().readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        }
        throw new UnsupportedOperationException("Reading Object types is not supported");
    }

    @Override
    protected void writeInternal(@NonNull Object object, @NonNull HttpOutputMessage outputMessage) throws IOException {
        // Handle Object type by checking if it's actually a String instance
        String content;
        if (object instanceof String) {
            content = (String) object;
        } else if (object != null) {
            // If it's not a String, convert to string representation
            // This handles edge cases where Object type is passed but value is String
            content = object.toString();
            log.warn("StringAsObjectHttpMessageConverter received non-String object: {}, converting to string", object.getClass().getName());
        } else {
            content = "";
        }
        
        // Ensure Content-Type is set to application/xml
        outputMessage.getHeaders().setContentType(MediaType.APPLICATION_XML);
        
        log.debug("StringAsObjectHttpMessageConverter writing XML content (length: {} chars)", content.length());
        // Write the string content as bytes
        outputMessage.getBody().write(content.getBytes(StandardCharsets.UTF_8));
    }
}

