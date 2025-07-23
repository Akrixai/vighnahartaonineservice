-- Add dynamic_field_documents column to applications table
-- This will store dynamic field documents with field mapping

-- Add the new column
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS dynamic_field_documents JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN applications.dynamic_field_documents IS 'Store dynamic field documents with field mapping - format: {"fieldId": ["url1", "url2"]}';

-- Create index for better performance on dynamic field documents queries
CREATE INDEX IF NOT EXISTS idx_applications_dynamic_field_documents 
ON applications USING GIN (dynamic_field_documents);

-- Update existing applications to have empty object if null
UPDATE applications 
SET dynamic_field_documents = '{}' 
WHERE dynamic_field_documents IS NULL;
