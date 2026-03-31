package eu.efti.platformgatesimulator.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity for storing consignment XML data in the database.
 * This replaces file-based storage to avoid Windows Docker bind mount permission issues.
 */
@Entity
@Table(name = "consignment_xml")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsignmentXml {

    @Id
    @Column(name = "dataset_id", length = 36)
    private String datasetId;

    @Column(name = "xml_content", columnDefinition = "TEXT", length = Integer.MAX_VALUE)
    private String xmlContent;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

