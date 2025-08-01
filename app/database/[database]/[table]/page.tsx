'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableData {
  columns: Column[];
  rows: Record<string, any>[];
  total_rows: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiResponse {
  success: boolean;
  data: TableData;
  error?: string;
}

export default function TableDataPage() {
  const params = useParams();
  const database = typeof params.database === 'string' ? decodeURIComponent(params.database) : '';
  const table = typeof params.table === 'string' ? decodeURIComponent(params.table) : '';
  
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  useEffect(() => {
    if (database && table) {
      fetchTableData();
    }
  }, [database, table, currentPage, perPage]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/database/rows?database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}&page=${currentPage}&per_page=${perPage}`
      );
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setTableData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch table data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (value: any, dataType: string) => {
    if (value === null) {
      return <span className="italic text-gray-400">NULL</span>;
    }

    if (value === '') {
      return <span className="text-gray-400">(empty)</span>;
    }

    const stringValue = String(value);

    // JSON/Array data
    if (dataType.includes('json') || dataType.includes('array')) {
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-xs whitespace-pre-wrap">
          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // Date/Time values
    if (dataType.includes('timestamp') || dataType.includes('date')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return stringValue;
      }
    }

    // Boolean values
    if (dataType.includes('boolean')) {
      return (
        <span className={`px-2 py-1 rounded text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'true' : 'false'}
        </span>
      );
    }

    // Long text handling
    if (stringValue.length > 100) {
      return (
        <div className="max-w-xs">
          <div className="truncate" title={stringValue}>
            {stringValue.substring(0, 97)}...
          </div>
        </div>
      );
    }

    return stringValue;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
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
            <Link href={`/database/${encodeURIComponent(database)}`} className="text-blue-600 hover:text-blue-800">
              {database}
            </Link>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-gray-900">{table}</span>
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
            <Link href={`/database/${encodeURIComponent(database)}`} className="text-blue-600 hover:text-blue-800">
              {database}
            </Link>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-gray-900">{table}</span>
          </nav>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading table data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchTableData}
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

  if (!tableData) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-6">
          <Link href="/database" className="text-blue-600 hover:text-blue-800">
            🗃️ Databases
          </Link>
          <span className="mx-2 text-gray-500">→</span>
          <Link href={`/database/${encodeURIComponent(database)}`} className="text-blue-600 hover:text-blue-800">
            {database}
          </Link>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-gray-900 font-medium">{table}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Data in {table}</h1>
          <p className="mt-2 text-gray-600">
            {tableData.total_rows.toLocaleString()} total rows • {tableData.columns.length} columns
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <label className="text-sm font-medium text-gray-700">Rows per page:</label>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, tableData.total_rows)} of {tableData.total_rows.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableData.columns.map((column) => (
                    <th
                      key={column.column_name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{column.column_name}</span>
                        <span className="text-xs text-gray-500 normal-case">{column.data_type}</span>
                        {column.is_nullable === 'NO' && (
                          <span className="text-xs text-red-600 normal-case">NOT NULL</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {tableData.columns.map((column) => (
                      <td
                        key={column.column_name}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {formatCellValue(row[column.column_name], column.data_type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {tableData.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {tableData.total_pages}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === tableData.total_pages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(tableData.total_pages)}
                disabled={currentPage === tableData.total_pages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 