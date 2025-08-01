# Database Setup Guide

## PostgreSQL Database for HubSpot Onboarding

This guide will help you set up the PostgreSQL database for the HubSpot onboarding application.

## 📋 Prerequisites

- PostgreSQL 12+ installed locally (for development)
- Node.js 16+ 

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hubspot_onboarding
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_SSL=false
DB_MAX_CONNECTIONS=20

# Application Settings
NODE_ENV=development
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hubspot_onboarding;

# Exit psql
\q
```

### 3. Run Database Setup

```bash
# Install dependencies
npm install

# Set up database schema and sample data
npm run db:setup
```

## 🗄️ Database Schema

### Projects Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | Project name |
| `customer` | VARCHAR(255) | Client/customer name |
| `created_date` | TIMESTAMP | Auto-generated creation timestamp |
| `project_start_date` | DATE | Planned/actual project start |
| `project_owner` | VARCHAR(255) | Valve team member responsible |
| `hubspot_hubs` | ENUM[] | Array of HubSpot hubs to implement |
| `status` | ENUM | Project status |
| `description` | TEXT | Project description |
| `updated_at` | TIMESTAMP | Auto-updated modification timestamp |

### Websites Table (Enhanced)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `project_id` | UUID | Foreign key to projects table |
| `url` | VARCHAR(2048) | Website URL |
| `name` | VARCHAR(255) | Optional website name |
| `description` | TEXT | Website description |
| `status` | ENUM | Website status (active/inactive/pending_review) |
| `crawl_status` | ENUM | Crawling status (pending/crawling/completed/failed/paused) |
| `total_pages_discovered` | INTEGER | Total pages found during discovery |
| `pages_crawled` | INTEGER | Successfully crawled pages |
| `pages_failed` | INTEGER | Failed crawl attempts |
| `max_pages` | INTEGER | Maximum pages to crawl (default: 30) |
| `max_depth` | INTEGER | Maximum crawl depth (default: 3) |
| `started_at` | TIMESTAMP | Crawl start time |
| `completed_at` | TIMESTAMP | Crawl completion time |
| `created_date` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Pages Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `website_id` | UUID | Foreign key to websites table |
| `url` | VARCHAR(2048) | Page URL |
| `title` | VARCHAR(500) | Page title |
| `content` | TEXT | Clean extracted text content |
| `raw_html` | TEXT | Original HTML content |
| `depth` | INTEGER | Crawl depth from starting URL |
| `word_count` | INTEGER | Number of words in content |
| `link_count` | INTEGER | Number of links found on page |
| `content_hash` | VARCHAR(64) | SHA256 hash for duplicate detection |
| `scraping_status` | ENUM | Processing status |
| `discovered_at` | TIMESTAMP | When page was discovered |
| `scraped_at` | TIMESTAMP | When page was scraped |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Chunks Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `page_id` | UUID | Foreign key to pages table |
| `content` | TEXT | Text chunk content |
| `chunk_index` | INTEGER | Index within page |
| `start_position` | INTEGER | Start position in original content |
| `end_position` | INTEGER | End position in original content |
| `word_count` | INTEGER | Number of words in chunk |
| `chunking_method` | ENUM | Method used for chunking |
| `embedding` | VECTOR(1536) | OpenAI vector embedding |
| `embedding_created_at` | TIMESTAMP | When embedding was generated |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Enums

**Project Status:**
- `pending` - Not yet started
- `active` - Currently in progress  
- `completed` - Successfully finished
- `on_hold` - Temporarily paused
- `cancelled` - Cancelled project

**Website Status:**
- `active` - Website is active and available for crawling
- `inactive` - Website is not active
- `pending_review` - Website awaiting review

**Crawl Status:**
- `pending` - Crawl not yet started
- `crawling` - Currently crawling in progress
- `completed` - Crawl completed successfully
- `failed` - Crawl failed
- `paused` - Crawl temporarily paused

**Page Status:**
- `pending` - Page discovered but not yet crawled
- `crawled` - Page successfully crawled
- `failed` - Page crawling failed
- `processing` - Page content being processed
- `chunked` - Page content split into chunks
- `vectorized` - Page chunks have vector embeddings

**Chunking Method:**
- `recursive` - Recursive text splitting (default)
- `character` - Fixed character length chunks
- `token` - Token-based chunking
- `semantic` - Semantic-aware chunking

**HubSpot Hubs:**
- `marketing_hub` - Marketing automation
- `sales_hub` - CRM and sales tools
- `service_hub` - Customer service tools
- `cms_hub` - Content management
- `operations_hub` - Data and automation tools

## 🔧 API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get project by ID |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Websites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/websites` | Get websites for project |
| POST | `/api/projects/[id]/websites` | Add website to project |
| GET | `/api/projects/[id]/websites/[websiteId]` | Get website details |
| PUT | `/api/projects/[id]/websites/[websiteId]` | Update website |
| DELETE | `/api/projects/[id]/websites/[websiteId]` | Delete website |

### Website Crawling (Coming Next)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/[id]/websites/[websiteId]/crawl` | Start website crawling |
| GET | `/api/projects/[id]/websites/[websiteId]/crawl` | Get crawl progress |
| GET | `/api/projects/[id]/websites/[websiteId]/pages` | Get crawled pages |
| GET | `/api/projects/[id]/websites/[websiteId]/chunks` | Get content chunks |

## 🚀 Heroku Deployment

The application is configured for Heroku deployment:

1. **Add Heroku Postgres:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

2. **Deploy:**
   ```bash
   git push heroku main
   ```

3. **Run database setup:**
   ```bash
   heroku run npm run db:setup
   ```

The `DATABASE_URL` environment variable is automatically set by Heroku Postgres.

## 🧠 AI/RAG Features

### Vector Embeddings
- **pgvector Extension**: Stores 1536-dimensional OpenAI embeddings
- **HNSW Index**: Fast similarity search with cosine distance
- **Chunking Strategy**: 1000 character chunks with 200 character overlap

### Database Views
- **`website_crawl_progress`**: Real-time crawling statistics per website
- **`page_chunk_stats`**: Chunking and vectorization progress per page

### Vector Search Function
```sql
SELECT * FROM find_similar_chunks(
  query_embedding,     -- Your query embedding
  0.8,                -- Similarity threshold (0-1)
  10,                 -- Max results
  project_id          -- Optional: filter by project
);
```

Returns chunks with similarity scores, page context, and website information.

## 🧪 Sample Data

The setup script includes sample projects:
- Nokia HubSpot Migration (active)
- Konecranes Sales Automation (pending)
- Gebwell Marketing Setup (completed)
- Solibri Integration Project (pending)

## 🔍 Troubleshooting

**Connection Issues:**
1. Ensure PostgreSQL is running
2. Check username/password
3. Verify database exists
4. Check firewall/network settings

**Schema Issues:**
1. Drop and recreate database if needed
2. Run `npm run db:setup` again
3. Check PostgreSQL version compatibility

**Vector/AI Features:**
1. **pgvector Extension Required**: Install pgvector for embedding support
   ```bash
   # On macOS with Homebrew
   brew install pgvector
   
   # On Ubuntu/Debian
   sudo apt-get install postgresql-15-pgvector
   
   # Then enable in database
   CREATE EXTENSION vector;
   ```
2. **OpenAI API Key**: Required for generating embeddings
3. **Memory Requirements**: Vector operations require adequate PostgreSQL memory

## 📚 Framework Integration

The database integrates with the hexagonal AI framework providing:
- Connection pooling
- Health monitoring  
- Transaction support
- Parameterized queries
- SSL support for production 