-- Remove Website Indexing Schema
-- This script removes all indexing-related database changes

-- Drop views first
DROP VIEW IF EXISTS website_indexing_stats;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS website_page_chunks;
DROP TABLE IF EXISTS website_pages;

-- Remove indexing-related columns from websites table
ALTER TABLE websites 
DROP COLUMN IF EXISTS indexing_status,
DROP COLUMN IF EXISTS indexed_at,
DROP COLUMN IF EXISTS indexing_error,
DROP COLUMN IF EXISTS content_chunks,
DROP COLUMN IF EXISTS last_crawled_at;

-- Drop enum types
DROP TYPE IF EXISTS indexing_status;

-- Note: We're keeping the pgvector extension in case it's used elsewhere
-- If you want to remove it completely, uncomment the line below:
-- DROP EXTENSION IF EXISTS vector;

-- Verify the cleanup
SELECT 'Indexing schema cleanup completed' as status; 