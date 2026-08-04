import { useState, useEffect, useMemo } from 'react';
import { httpClient } from '../../../core/http/httpClient';
import { Database, Table as TableIcon, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';

interface SchemaData {
  database_type?: string;
  project?: string;
  tables?: string[];
}

export const TablesSection = ({ tenantName }: { tenantName: string }) => {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await httpClient.get<any>(`/${tenantName}/data`);
        const schemaData = res?.data || res;
        setSchema(schemaData);
        if (schemaData?.tables?.length > 0) {
          setSelectedTable(schemaData.tables[0]);
        }
      } catch (error) {
        console.error('Error fetching schema', error);
      } finally {
        setIsLoadingSchema(false);
      }
    };
    fetchSchema();
  }, [tenantName]);

  useEffect(() => {
    if (!selectedTable) return;
    
    const fetchTableData = async () => {
      setIsLoadingData(true);
      try {
        const res = await httpClient.get<any>(`/${tenantName}/table/${selectedTable}`);
        setTableData(Array.isArray(res) ? res : res?.data || []);
      } catch (error) {
        console.error('Error fetching table data', error);
        setTableData([]); // Fallback
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchTableData();
  }, [tenantName, selectedTable]);

  // Filtro y Paginación Local
  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    const lowerSearch = searchTerm.toLowerCase();
    return tableData.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearch))
    );
  }, [tableData, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  // Reset page when search or table changes
  useEffect(() => { setPage(1); }, [searchTerm, selectedTable]);

  if (isLoadingSchema) {
    return <div className="flex items-center justify-center h-64 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl flex flex-col items-center justify-center">
        <div className="p-4 bg-white rounded-full shadow-sm border border-slate-200 mb-4">
          <Database className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Sin tablas disponibles</h3>
        <p className="text-slate-500 max-w-md">No se encontraron tablas para este tenant o hubo un problema al obtener el esquema de la base de datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TableIcon className="w-6 h-6 text-blue-600" />
          Explorador de Datos
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar registros..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Tabla:</span>
            <select 
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2 w-full shadow-sm"
            >
              {schema.tables.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
        {isLoadingData ? (
          <div className="flex justify-center items-center h-80 bg-slate-50">
             <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  {tableData.length > 0 ? (
                    Object.keys(tableData[0]).map(key => (
                      <th key={key} className="px-6 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))
                  ) : (
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Datos</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors bg-white">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={100} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                      {searchTerm ? 'No hay resultados que coincidan con la búsqueda.' : 'La tabla está vacía o no hay datos para mostrar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginación */}
        <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-white">
          <span className="text-sm font-medium text-slate-500">
            Mostrando {filteredData.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} a {Math.min(page * rowsPerPage, filteredData.length)} de {filteredData.length} registros
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="flex items-center px-4 font-medium text-slate-700 text-sm">
              {page} / {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
