-- Enhanced Website Crawling Schema for HubSpot Onboarding
-- This extends the existing schema with crawling, content processing, and vector storage capabilities

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ENUM types for crawling statuses
CREATE TYPE crawl_status AS ENUM ('pending', 'crawling', 'completed', 'failed', 'paused');
CREATE TYPE page_status AS ENUM ('pending', 'crawled', 'failed', 'processing', 'chunked', 'vectorized');
CREATE TYPE chunking_method AS ENUM ('recursive', 'character', 'token', 'semantic');

-- Extend the existing websites table with crawling-specific fields
ALTER TABLE websites ADD COLUMN IF NOT EXISTS crawl_status crawl_status DEFAULT 'pending';
ALTER TABLE websites ADD COLUMN IF NOT EXISTS total_pages_discovered INTEGER DEFAULT 0;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS pages_crawled INTEGER DEFAULT 0;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS pages_failed INTEGER DEFAULT 0;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS max_pages INTEGER DEFAULT 30;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS max_depth INTEGER DEFAULT 3;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new website fields
CREATE INDEX IF NOT EXISTS idx_websites_crawl_status ON websites(crawl_status);
CREATE INDEX IF NOT EXISTS idx_websites_project_crawl_status ON websites(project_id, crawl_status);

-- Create pages table for storing individual page content
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(500),
    content TEXT,              -- Clean extracted text
    raw_html TEXT,            -- Original HTML content
    depth INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    link_count INTEGER DEFAULT 0,
    content_hash VARCHAR(64), -- SHA256 hash for deduplication
    scraping_status page_status NOT NULL DEFAULT 'pending',
    discovered_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_pages_website 
        FOREIGN KEY (website_id) 
        REFERENCES websites(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique URLs per website
    CONSTRAINT unique_page_per_website UNIQUE(website_id, url),
    
    -- Constraints
    CONSTRAINT pages_url_not_empty CHECK (LENGTH(TRIM(url)) > 0),
    CONSTRAINT pages_depth_valid CHECK (depth >= 0),
    CONSTRAINT pages_word_count_valid CHECK (word_count >= 0),
    CONSTRAINT pages_link_count_valid CHECK (link_count >= 0)
);

-- Create indexes for pages table
CREATE INDEX IF NOT EXISTS idx_pages_website_id ON pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_scraping_status ON pages(scraping_status);
CREATE INDEX IF NOT EXISTS idx_pages_website_status ON pages(website_id, scraping_status);
CREATE INDEX IF NOT EXISTS idx_pages_depth ON pages(depth);
CREATE INDEX IF NOT EXISTS idx_pages_discovered_at ON pages(discovered_at);
CREATE INDEX IF NOT EXISTS idx_pages_content_hash ON pages(content_hash);

-- Create chunks table for storing text chunks with embeddings
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    word_count INTEGER,
    chunking_method chunking_method NOT NULL DEFAULT 'recursive',
    embedding VECTOR(1536),   -- OpenAI text-embedding-3-small dimensions
    embedding_created_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_chunks_page 
        FOREIGN KEY (page_id) 
        REFERENCES pages(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique chunks per page
    CONSTRAINT unique_chunk_per_page UNIQUE(page_id, chunk_index),
    
    -- Constraints
    CONSTRAINT chunks_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT chunks_chunk_index_valid CHECK (chunk_index >= 0),
    CONSTRAINT chunks_start_position_valid CHECK (start_position >= 0),
    CONSTRAINT chunks_end_position_valid CHECK (end_position >= start_position),
    CONSTRAINT chunks_word_count_valid CHECK (word_count >= 0)
);

-- Create indexes for chunks table
CREATE INDEX IF NOT EXISTS idx_chunks_page_id ON chunks(page_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_chunking_method ON chunks(chunking_method);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_created ON chunks(embedding_created_at);

-- Create HNSW index for vector similarity search (only if embeddings exist)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON chunks USING hnsw (embedding vector_cosine_ops) 
WHERE embedding IS NOT NULL;

-- Create trigger to update updated_at timestamps for pages
CREATE OR REPLACE FUNCTION update_page_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_page_updated_at_column();

-- Create trigger to update updated_at timestamps for chunks
CREATE OR REPLACE FUNCTION update_chunk_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chunks_updated_at 
    BEFORE UPDATE ON chunks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_chunk_updated_at_column();

-- Create view for website crawl progress
CREATE OR REPLACE VIEW website_crawl_progress AS
SELECT 
    w.id as website_id,
    w.project_id,
    w.url as website_url,
    w.name as website_name,
    w.crawl_status,
    w.total_pages_discovered,
    w.pages_crawled,
    w.pages_failed,
    w.max_pages,
    w.max_depth,
    w.started_at,
    w.completed_at,
    COALESCE(p.pages_count, 0) as actual_pages_count,
    COALESCE(p.pending_pages, 0) as pending_pages,
    COALESCE(p.crawled_pages, 0) as crawled_pages,
    COALESCE(p.failed_pages, 0) as failed_pages,
    COALESCE(p.processing_pages, 0) as processing_pages,
    COALESCE(p.chunked_pages, 0) as chunked_pages,
    COALESCE(p.vectorized_pages, 0) as vectorized_pages,
    CASE 
        WHEN w.total_pages_discovered > 0 
        THEN ROUND((w.pages_crawled::decimal / w.total_pages_discovered::decimal) * 100, 2)
        ELSE 0 
    END as crawl_progress_percent
FROM websites w
LEFT JOIN (
    SELECT 
        website_id,
        COUNT(*) as pages_count,
        COUNT(CASE WHEN scraping_status = 'pending' THEN 1 END) as pending_pages,
        COUNT(CASE WHEN scraping_status = 'crawled' THEN 1 END) as crawled_pages,
        COUNT(CASE WHEN scraping_status = 'failed' THEN 1 END) as failed_pages,
        COUNT(CASE WHEN scraping_status = 'processing' THEN 1 END) as processing_pages,
        COUNT(CASE WHEN scraping_status = 'chunked' THEN 1 END) as chunked_pages,
        COUNT(CASE WHEN scraping_status = 'vectorized' THEN 1 END) as vectorized_pages
    FROM pages 
    GROUP BY website_id
) p ON w.id = p.website_id;

-- Create view for page chunk statistics
CREATE OR REPLACE VIEW page_chunk_stats AS
SELECT 
    p.id as page_id,
    p.website_id,
    p.url as page_url,
    p.title as page_title,
    p.scraping_status,
    p.word_count as page_word_count,
    p.scraped_at,
    COALESCE(c.chunks_count, 0) as chunks_count,
    COALESCE(c.total_chunk_words, 0) as total_chunk_words,
    COALESCE(c.vectorized_chunks, 0) as vectorized_chunks,
    CASE 
        WHEN c.chunks_count > 0 
        THEN ROUND((c.vectorized_chunks::decimal / c.chunks_count::decimal) * 100, 2)
        ELSE 0 
    END as vectorization_progress_percent
FROM pages p
LEFT JOIN (
    SELECT 
        page_id,
        COUNT(*) as chunks_count,
        SUM(word_count) as total_chunk_words,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as vectorized_chunks
    FROM chunks 
    GROUP BY page_id
) c ON p.id = c.page_id;

-- Create function for finding similar chunks (for future RAG implementation)
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.8,
    max_results INTEGER DEFAULT 10,
    target_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    page_id UUID,
    website_id UUID,
    project_id UUID,
    content TEXT,
    page_url VARCHAR(2048),
    page_title VARCHAR(500),
    website_name VARCHAR(255),
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chunk_id,
        c.page_id,
        p.website_id,
        w.project_id,
        c.content,
        p.url as page_url,
        p.title as page_title,
        w.name as website_name,
        1 - (c.embedding <=> query_embedding) as similarity_score
    FROM chunks c
    JOIN pages p ON c.page_id = p.id
    JOIN websites w ON p.website_id = w.id
    WHERE 
        c.embedding IS NOT NULL
        AND 1 - (c.embedding <=> query_embedding) >= similarity_threshold
        AND (target_project_id IS NULL OR w.project_id = target_project_id)
    ORDER BY c.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE pages IS 'Individual pages discovered and crawled from websites';
COMMENT ON TABLE chunks IS 'Text chunks from pages with vector embeddings for semantic search';
COMMENT ON COLUMN websites.crawl_status IS 'Current status of the crawling process';
COMMENT ON COLUMN websites.total_pages_discovered IS 'Total number of pages found during discovery phase';
COMMENT ON COLUMN websites.pages_crawled IS 'Number of pages successfully crawled and processed';
COMMENT ON COLUMN websites.max_pages IS 'Maximum number of pages to crawl for this website';
COMMENT ON COLUMN websites.max_depth IS 'Maximum crawl depth from the starting URL';
COMMENT ON COLUMN pages.content IS 'Clean extracted text content from the page';
COMMENT ON COLUMN pages.raw_html IS 'Original HTML content of the page';
COMMENT ON COLUMN pages.content_hash IS 'SHA256 hash for detecting duplicate content';
COMMENT ON COLUMN chunks.embedding IS 'Vector embedding for semantic search (1536 dimensions for OpenAI)';
COMMENT ON COLUMN chunks.chunking_method IS 'Method used to split the content into chunks'; 