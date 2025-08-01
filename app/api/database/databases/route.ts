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