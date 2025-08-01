-- HubSpot Onboarding Database Schema
-- Projects table for managing HubSpot onboarding projects

-- Create ENUM type for project status
CREATE TYPE project_status AS ENUM ('pending', 'active', 'completed', 'on_hold', 'cancelled');

-- Create ENUM type for HubSpot Hubs
CREATE TYPE hubspot_hub AS ENUM (
  'marketing_hub', 
  'sales_hub', 
  'service_hub', 
  'cms_hub', 
  'operations_hub'
);

-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  project_start_date DATE,
  project_owner VARCHAR(255) NOT NULL,
  hubspot_hubs hubspot_hub[] DEFAULT '{}',
  status project_status DEFAULT 'pending',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT projects_customer_not_empty CHECK (LENGTH(TRIM(customer)) > 0),
  CONSTRAINT projects_owner_not_empty CHECK (LENGTH(TRIM(project_owner)) > 0)
  -- Note: Removed projects_start_date_valid constraint to allow projects with past start dates
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_date ON projects(created_date);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(project_owner);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

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
  
  CONSTRAINT fk_websites_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT websites_url_not_empty CHECK (LENGTH(TRIM(url)) > 0),
  CONSTRAINT websites_url_format CHECK (
    url ~* '^https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(/.*)?$'
  ),
  CONSTRAINT websites_name_length CHECK (
    name IS NULL OR LENGTH(TRIM(name)) > 0
  ),
  CONSTRAINT unique_website_per_project UNIQUE (project_id, url)
);

-- Insert sample data
-- Insert sample data with proper dates
INSERT INTO projects (name, customer, project_start_date, project_owner, hubspot_hubs, status, description, created_date) VALUES
(
  'Nokia HubSpot Migration',
  'Nokia',
  '2024-01-20',
  'Sarah Johnson',
  '{"marketing_hub", "sales_hub"}',
  'active',
  'Complete HubSpot setup and data migration for Nokia communications division',
  '2024-01-15 10:00:00+00'
),
(
  'Konecranes Sales Automation',
  'Konecranes',
  '2024-01-25',
  'Mike Anderson',
  '{"sales_hub", "service_hub"}',
  'pending',
  'Implement sales automation workflows and lead scoring for industrial equipment',
  '2024-01-10 14:30:00+00'
),
(
  'Gebwell Marketing Setup',
  'Gebwell',
  '2024-01-15',
  'Emma Wilson',
  '{"marketing_hub", "cms_hub"}',
  'completed',
  'Marketing automation setup and campaign templates for healthcare platform',
  '2024-01-05 09:00:00+00'
),
(
  'Solibri Integration Project',
  'Solibri',
  '2024-02-05',
  'David Chen',
  '{"sales_hub", "operations_hub"}',
  'pending',
  'HubSpot integration with existing BIM software solutions',
  '2024-02-01 11:00:00+00'
);

-- Comment on table and columns for documentation
COMMENT ON TABLE projects IS 'HubSpot onboarding projects managed by Valve';
COMMENT ON COLUMN projects.id IS 'Unique project identifier';
COMMENT ON COLUMN projects.name IS 'Human-readable project name';
COMMENT ON COLUMN projects.customer IS 'Client/customer company name';
COMMENT ON COLUMN projects.created_date IS 'When the project was created in the system';
COMMENT ON COLUMN projects.project_start_date IS 'Planned or actual project start date';
COMMENT ON COLUMN projects.project_owner IS 'Valve team member responsible for the project';
COMMENT ON COLUMN projects.hubspot_hubs IS 'Array of HubSpot hubs to be implemented';
COMMENT ON COLUMN projects.status IS 'Current project status';
COMMENT ON COLUMN projects.description IS 'Detailed project description and scope'; 