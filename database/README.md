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

### Enums

**Project Status:**
- `pending` - Not yet started
- `active` - Currently in progress  
- `completed` - Successfully finished
- `on_hold` - Temporarily paused
- `cancelled` - Cancelled project

**HubSpot Hubs:**
- `marketing_hub` - Marketing automation
- `sales_hub` - CRM and sales tools
- `service_hub` - Customer service tools
- `cms_hub` - Content management
- `operations_hub` - Data and automation tools

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get project by ID |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

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

## 📚 Framework Integration

The database integrates with the hexagonal AI framework providing:
- Connection pooling
- Health monitoring  
- Transaction support
- Parameterized queries
- SSL support for production 