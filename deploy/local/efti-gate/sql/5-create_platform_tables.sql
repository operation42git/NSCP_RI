-- Create table for storing consignment XML data
-- This table is used by the platform simulator to store XML content instead of files
-- to avoid Windows Docker bind mount permission issues

CREATE TABLE IF NOT EXISTS consignment_xml (
    dataset_id VARCHAR(36) PRIMARY KEY,
    xml_content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Grant permissions to the efti user
GRANT ALL PRIVILEGES ON TABLE consignment_xml TO efti;

-- Add comment for documentation
COMMENT ON TABLE consignment_xml IS 'Stores consignment XML data uploaded through the platform simulator';
COMMENT ON COLUMN consignment_xml.dataset_id IS 'Unique identifier for the dataset (UUID format)';
COMMENT ON COLUMN consignment_xml.xml_content IS 'Full XML content of the consignment';
COMMENT ON COLUMN consignment_xml.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN consignment_xml.updated_at IS 'Timestamp when the record was last updated';




