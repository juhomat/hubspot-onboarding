import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../../../../lib/config/database';

export async function GET() {
  let pool: Pool | null = null;
  
  try {
    const config = getDatabaseConfig();
    
    // Connect to the default postgres database to list all databases
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres', // Connect to default postgres database
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    const query = `
      SELECT 
        d.datname as name,
        pg_size_pretty(pg_database_size(d.datname)) as size,
        d.encoding,
        d.datcollate as collate,
        r.rolname as owner
      FROM pg_database d
      JOIN pg_roles r ON d.datdba = r.oid
      WHERE d.datistemplate = false
      ORDER BY d.datname;
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Database list error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');

  if (!database) {
    return NextResponse.json({
      success: false,
      error: 'Database parameter is required'
    }, { status: 400 });
  }

  // Prevent deletion of system databases
  const systemDatabases = ['postgres', 'template0', 'template1'];
  if (systemDatabases.includes(database)) {
    return NextResponse.json({
      success: false,
      error: 'Cannot delete system databases'
    }, { status: 400 });
  }

  let pool: Pool | null = null;
  
  try {
    const config = getDatabaseConfig();
    
    // Connect to the default postgres database to delete the target database
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres', // Connect to default postgres database
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    // First, terminate all connections to the target database
    await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `, [database]);

    // Drop the database
    await pool.query(`DROP DATABASE "${database}";`);

    return NextResponse.json({
      success: true,
      message: `Database "${database}" has been deleted successfully`
    });

  } catch (error) {
    console.error('Database deletion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
} 