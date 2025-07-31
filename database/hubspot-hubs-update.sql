-- Update HubSpot Hub options
-- Remove: cms_hub
-- Add: hubspot_crm, commerce_hub, content_hub

-- First, add the new enum values
ALTER TYPE hubspot_hub ADD VALUE IF NOT EXISTS 'hubspot_crm';
ALTER TYPE hubspot_hub ADD VALUE IF NOT EXISTS 'commerce_hub';
ALTER TYPE hubspot_hub ADD VALUE IF NOT EXISTS 'content_hub';

-- Check what projects are using cms_hub before removing it
SELECT p.name, p.customer, p.hubspot_hubs 
FROM projects p 
WHERE 'cms_hub' = ANY(p.hubspot_hubs);

-- Update any existing projects that use cms_hub to content_hub (as it's the closest replacement)
UPDATE projects 
SET hubspot_hubs = array_replace(hubspot_hubs, 'cms_hub', 'content_hub')
WHERE 'cms_hub' = ANY(hubspot_hubs);

-- Note: PostgreSQL doesn't support removing ENUM values directly
-- If we need to remove cms_hub completely, we would need to:
-- 1. Create a new ENUM type without cms_hub
-- 2. Update the table to use the new type
-- 3. Drop the old type
-- For now, we'll leave cms_hub in the ENUM but not use it in the UI

-- Verify the current ENUM values
SELECT unnest(enum_range(NULL::hubspot_hub)) as hub_options; 