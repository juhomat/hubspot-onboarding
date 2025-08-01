import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../../../../lib/config/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');

  if (!database) {
    return NextResponse.json({
      success: false,
      error: 'Database parameter is required'
    }, { status: 400 });
  }

  let pool: Pool | null = null;
  
  try {
    const config = getDatabaseConfig();
    
    // Connect to the specified database
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    const query = `
      SELECT 
        t.table_name,
        t.table_type,
        COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        (
          SELECT COUNT(*)
          FROM information_schema.columns 
          WHERE table_catalog = $1 
          AND table_name = t.table_name
          AND table_schema = 'public'
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_catalog = $1 
      AND t.table_schema = 'public'
      ORDER BY t.table_name;
    `;

    const result = await pool.query(query, [database]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Table list error:', error);
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