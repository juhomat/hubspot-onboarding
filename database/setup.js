const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local for development
require('dotenv').config({ path: '.env.local' });

// Database configuration
const getDbConfig = () => {
  // Check for Heroku DATABASE_URL first
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hubspot_onboarding',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true'
  };
};

async function setupDatabase() {
  console.log('🗄️  Setting up HubSpot Onboarding Database...\n');
  
  const pool = new Pool(getDbConfig());
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Read and execute main schema
    console.log('📋 Reading main database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔨 Creating main database schema...');
    await pool.query(schema);
    console.log('✅ Main database schema created successfully\n');
    
    // Read and execute enhanced website crawling schema
    console.log('📋 Reading enhanced website crawling schema...');
    const enhancedSchemaPath = path.join(__dirname, 'websites-enhanced-schema.sql');
    const enhancedSchema = fs.readFileSync(enhancedSchemaPath, 'utf8');
    
    console.log('🔨 Creating enhanced website crawling schema...');
    await pool.query(enhancedSchema);
    console.log('✅ Enhanced website crawling schema created successfully\n');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'websites', 'pages', 'chunks')
      ORDER BY table_name
    `);
    
    console.log('📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    
    if (tablesResult.rows.some(row => row.table_name === 'projects')) {
      // Check sample data
      const countResult = await pool.query('SELECT COUNT(*) FROM projects');
      console.log(`\n📊 Sample data: ${countResult.rows[0].count} projects inserted`);
      
      // Show sample projects
      const sampleResult = await pool.query(`
        SELECT name, customer, status, hubspot_hubs 
        FROM projects 
        ORDER BY created_date DESC 
        LIMIT 3
      `);
      
      console.log('\n📝 Sample projects:');
      sampleResult.rows.forEach(project => {
        console.log(`  • ${project.name} (${project.customer}) - ${project.status}`);
        console.log(`    HubSpot Hubs: ${project.hubspot_hubs.join(', ')}`);
      });
    }
    
    // Check if pgvector extension is available
    const extensionResult = await pool.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    
    if (extensionResult.rows.length > 0) {
      console.log('\n✅ pgvector extension is installed and ready for embeddings');
    } else {
      console.log('\n⚠️  pgvector extension not found - vector embeddings will not work');
      console.log('    Install with: CREATE EXTENSION vector; (requires pgvector package)');
    }
    
    // Check website crawling status enums
    const enumResult = await pool.query(`
      SELECT typname FROM pg_type 
      WHERE typname IN ('crawl_status', 'page_status', 'chunking_method')
      ORDER BY typname
    `);
    
    console.log('\n📊 Crawling enums created:');
    enumResult.rows.forEach(row => {
      console.log(`  • ${row.typname}`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n🚀 Ready for website crawling and content processing!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your database credentials');
    console.error('  3. Ensure the database exists');
    console.error('  4. Verify network connectivity');
    console.error('  5. For vector embeddings, install pgvector: https://github.com/pgvector/pgvector');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase }; 