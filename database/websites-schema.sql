-- Customer Websites Table Schema
-- Stores website URLs associated with HubSpot onboarding projects

-- Create ENUM type for website status
CREATE TYPE website_status AS ENUM ('active', 'inactive', 'pending_review');

-- Create Websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  url VARCHAR(2048) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  status website_status DEFAULT 'active',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT fk_websites_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT websites_url_not_empty CHECK (LENGTH(TRIM(url)) > 0),
  CONSTRAINT websites_url_format CHECK (
    url ~* '^https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(/.*)?$'
  ),
  CONSTRAINT websites_name_length CHECK (
    name IS NULL OR LENGTH(TRIM(name)) > 0
  ),
  
  -- Unique constraint to prevent duplicate URLs per project
  CONSTRAINT unique_website_per_project UNIQUE (project_id, url)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_project_id ON websites(project_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_created_date ON websites(created_date);
CREATE INDEX IF NOT EXISTS idx_websites_url_domain ON websites(
  SUBSTRING(url FROM 'https?://([^/]+)')
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_websites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_websites_updated_at 
  BEFORE UPDATE ON websites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_websites_updated_at();

-- Insert sample websites for existing projects
INSERT INTO websites (project_id, url, name, description, status) 
SELECT 
  p.id,
  CASE p.customer
    WHEN 'Nokia' THEN 'https://www.nokia.com'
    WHEN 'Konecranes' THEN 'https://www.konecranes.com'
    WHEN 'Gebwell' THEN 'https://www.gebwell.com'
    WHEN 'Solibri' THEN 'https://www.solibri.com'
    ELSE 'https://example.com'
  END,
  CASE p.customer
    WHEN 'Nokia' THEN 'Nokia Corporate Website'
    WHEN 'Konecranes' THEN 'Konecranes Main Site'
    WHEN 'Gebwell' THEN 'Gebwell Platform'
    WHEN 'Solibri' THEN 'Solibri Software'
    ELSE 'Main Website'
  END,
  'Primary corporate website for HubSpot integration',
  'active'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM websites w WHERE w.project_id = p.id
);

-- Add secondary websites for some customers
INSERT INTO websites (project_id, url, name, description, status) 
SELECT 
  p.id,
  CASE p.customer
    WHEN 'Nokia' THEN 'https://networks.nokia.com'
    WHEN 'Konecranes' THEN 'https://www.konecranes.com/industries'
    ELSE NULL
  END,
  CASE p.customer
    WHEN 'Nokia' THEN 'Nokia Networks'
    WHEN 'Konecranes' THEN 'Konecranes Industries'
    ELSE NULL
  END,
  'Secondary website for specialized content',
  'active'
FROM projects p
WHERE p.customer IN ('Nokia', 'Konecranes')
AND NOT EXISTS (
  SELECT 1 FROM websites w 
  WHERE w.project_id = p.id 
  AND w.url LIKE '%networks.nokia.com%' 
  OR w.url LIKE '%industries%'
);

-- Comments for documentation
COMMENT ON TABLE websites IS 'Customer websites associated with HubSpot onboarding projects';
COMMENT ON COLUMN websites.id IS 'Unique website identifier';
COMMENT ON COLUMN websites.project_id IS 'Reference to the associated project';
COMMENT ON COLUMN websites.url IS 'Full URL of the customer website';
COMMENT ON COLUMN websites.name IS 'Friendly name or title for the website';
COMMENT ON COLUMN websites.description IS 'Description of the website purpose or content';
COMMENT ON COLUMN websites.status IS 'Current status of the website in the project';
COMMENT ON COLUMN websites.created_date IS 'When the website was added to the project';
COMMENT ON COLUMN websites.updated_at IS 'Last modification timestamp';

-- Create a view for easy project-website queries
CREATE OR REPLACE VIEW project_websites AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.customer,
  w.id as website_id,
  w.url,
  w.name as website_name,
  w.description as website_description,
  w.status as website_status,
  w.created_date as website_created,
  COUNT(w.id) OVER (PARTITION BY p.id) as total_websites
FROM projects p
LEFT JOIN websites w ON p.id = w.project_id
ORDER BY p.name, w.created_date; 