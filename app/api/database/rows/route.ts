import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../../../../lib/config/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');
  const table = searchParams.get('table');
  const page = parseInt(searchParams.get('page') || '1');
  const per_page = Math.min(parseInt(searchParams.get('per_page') || '50'), 1000);

  if (!database || !table) {
    return NextResponse.json({
      success: false,
      error: 'Database and table parameters are required'
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

    // Get column metadata
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_catalog = $1
      AND table_name = $2
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const columnsResult = await pool.query(columnsQuery, [database, table]);

    // Get total row count
    const countQuery = `SELECT COUNT(*) as total FROM "${table}";`;
    const countResult = await pool.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * per_page;
    const totalPages = Math.ceil(totalRows / per_page);

    // Get data
    const dataQuery = `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2;`;
    const dataResult = await pool.query(dataQuery, [per_page, offset]);

    return NextResponse.json({
      success: true,
      data: {
        columns: columnsResult.rows,
        rows: dataResult.rows,
        total_rows: totalRows,
        page: page,
        per_page: per_page,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error('Table data error:', error);
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