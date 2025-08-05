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

    // First, get the basic table information
    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_type,
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
      WHERE t.table_catalog = $1 
      AND t.table_schema = 'public'
      ORDER BY t.table_name;
    `;

    const tablesResult = await pool.query(tablesQuery, [database]);

    // Get actual row counts for each table
    const tablesWithCounts = await Promise.all(
      tablesResult.rows.map(async (table) => {
        try {
          if (!pool) {
            throw new Error('Database connection not available');
          }
          const countQuery = `SELECT COUNT(*) as row_count FROM "${table.table_name}";`;
          const countResult = await pool.query(countQuery);
          return {
            ...table,
            row_count: parseInt(countResult.rows[0].row_count)
          };
        } catch (error) {
          console.error(`Error counting rows for table ${table.table_name}:`, error);
          return {
            ...table,
            row_count: 0
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: tablesWithCounts
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

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');
  const table = searchParams.get('table');

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

    // Drop the table
    await pool.query(`DROP TABLE "${table}";`);

    return NextResponse.json({
      success: true,
      message: `Table "${table}" has been deleted successfully`
    });

  } catch (error) {
    console.error('Table deletion error:', error);
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