const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    
    // Read and execute schema
    console.log('📋 Reading database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔨 Creating database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully\n');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'projects'
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Projects table created successfully');
      
      // Check sample data
      const countResult = await pool.query('SELECT COUNT(*) FROM projects');
      console.log(`📊 Sample data: ${countResult.rows[0].count} projects inserted\n`);
      
      // Show sample projects
      const sampleResult = await pool.query(`
        SELECT name, customer, status, hubspot_hubs 
        FROM projects 
        ORDER BY created_date DESC 
        LIMIT 3
      `);
      
      console.log('📝 Sample projects:');
      sampleResult.rows.forEach(project => {
        console.log(`  • ${project.name} (${project.customer}) - ${project.status}`);
        console.log(`    HubSpot Hubs: ${project.hubspot_hubs.join(', ')}`);
      });
      
    } else {
      console.log('❌ Projects table not found');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your database credentials');
    console.error('  3. Ensure the database exists');
    console.error('  4. Verify network connectivity');
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