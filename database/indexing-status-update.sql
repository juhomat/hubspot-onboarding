-- Add indexing status columns to websites table

-- Add indexing status enum
CREATE TYPE indexing_status AS ENUM ('not_indexed', 'indexing', 'indexed', 'failed');

-- Add indexing-related columns to websites table
ALTER TABLE websites 
ADD COLUMN indexing_status indexing_status DEFAULT 'not_indexed',
ADD COLUMN indexed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN indexing_error TEXT,
ADD COLUMN content_chunks INTEGER DEFAULT 0,
ADD COLUMN last_crawled_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_websites_indexing_status ON websites(indexing_status);
CREATE INDEX idx_websites_indexed_at ON websites(indexed_at);

-- Add comments
COMMENT ON COLUMN websites.indexing_status IS 'Current indexing status of the website content';
COMMENT ON COLUMN websites.indexed_at IS 'Timestamp when the website was last successfully indexed';
COMMENT ON COLUMN websites.indexing_error IS 'Error message if indexing failed';
COMMENT ON COLUMN websites.content_chunks IS 'Number of content chunks created during indexing';
COMMENT ON COLUMN websites.last_crawled_at IS 'Timestamp when the website was last crawled for content';

-- Update existing websites to have not_indexed status
UPDATE websites SET indexing_status = 'not_indexed' WHERE indexing_status IS NULL; 