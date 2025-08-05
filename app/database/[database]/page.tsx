'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Table {
  table_name: string;
  table_type: string;
  row_count: number;
  size: string;
  columns: number;
}

interface ApiResponse {
  success: boolean;
  data: Table[];
  error?: string;
}

export default function DatabaseTablesPage() {
  const params = useParams();
  const database = typeof params.database === 'string' ? decodeURIComponent(params.database) : '';
  
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (database) {
      fetchTables();
    }
  }, [database]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/database/tables?database=${encodeURIComponent(database)}`);
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setTables(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch tables');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableName: string) => {
    try {
      setDeleteLoading(tableName);
      const response = await fetch(`/api/database/tables?database=${encodeURIComponent(database)}&table=${encodeURIComponent(tableName)}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the deleted table from the list
        setTables(tables.filter(table => table.table_name !== tableName));
        setDeleteConfirm(null);
      } else {
        setError(result.error || 'Failed to delete table');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getTableTypeColor = (type: string) => {
    switch (type) {
      case 'BASE TABLE':
        return 'bg-blue-100 text-blue-800';
      case 'VIEW':
        return 'bg-green-100 text-green-800';
      case 'MATERIALIZED VIEW':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableTypeIcon = (type: string) => {
    switch (type) {
      case 'BASE TABLE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        );
      case 'VIEW':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-6">
            <Link href="/database" className="text-blue-600 hover:text-blue-800">
              🗃️ Databases
            </Link>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-gray-900">{database}</span>
          </nav>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-6">
            <Link href="/database" className="text-blue-600 hover:text-blue-800">
              🗃️ Databases
            </Link>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-gray-900">{database}</span>
          </nav>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading tables</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchTables}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-6">
          <Link href="/database" className="text-blue-600 hover:text-blue-800">
            🗃️ Databases
          </Link>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-gray-900 font-medium">{database}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tables in {database}</h1>
          <p className="mt-2 text-gray-600">Browse tables, views, and their metadata</p>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
            <p className="mt-1 text-sm text-gray-500">This database doesn't contain any tables in the public schema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.table_name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getTableTypeIcon(table.table_type)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 break-all">{table.table_name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTableTypeColor(table.table_type)}`}>
                        {table.table_type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{table.row_count.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Rows</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{table.columns}</div>
                      <div className="text-sm text-gray-500">Columns</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Size:</span>
                    <span className="text-sm font-medium text-gray-900">{table.size}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/database/${encodeURIComponent(database)}/${encodeURIComponent(table.table_name)}`}
                    className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
                  >
                    View Data
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  <button
                    onClick={() => setDeleteConfirm(table.table_name)}
                    disabled={deleteLoading === table.table_name}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    {deleteLoading === table.table_name ? (
                      <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-2 px-7 py-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Table</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to delete the table "{deleteConfirm}"? This action cannot be undone and will permanently remove all data.
                  </p>
                </div>
                <div className="flex gap-3 px-4 py-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleteLoading === deleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex-1"
                  >
                    {deleteLoading === deleteConfirm ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 