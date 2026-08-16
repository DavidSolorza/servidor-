import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { httpClient } from '../../../core/http/httpClient';
import { format, parseISO } from 'date-fns';
import { socket } from '../../../core/http/socketClient';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  details?: string;
}

export const LogsSection = ({ tenantName }: { tenantName: string }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filter !== 'all') queryParams.append('level', filter);
        const searchQuery = search || tenantName;
        if (searchQuery) queryParams.append('search', searchQuery);
        queryParams.append('limit', '100');

        const res = await httpClient.get<any>(`/logs?${queryParams.toString()}`);
        const data = res?.data || res;
        
        if (data && Array.isArray(data.data)) {
          setLogs(data.data);
        } else if (Array.isArray(data)) {
          setLogs(data);
        }
      } catch (error) {
        console.error('Error fetching logs', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    
    const handleNewLog = (newLog: LogEntry) => {
      setLogs((prevLogs) => {
        // Apply current filter to incoming logs if needed
        if (filter !== 'all' && newLog.level !== filter) {
          return prevLogs;
        }
        
        // Prevent duplicates
        if (prevLogs.some(log => log.id === newLog.id)) {
          return prevLogs;
        }

        const updatedLogs = [newLog, ...prevLogs];
        // Keep maximum of 500 logs in memory
        if (updatedLogs.length > 500) {
          return updatedLogs.slice(0, 500);
        }
        return updatedLogs;
      });
    };

    socket.on('new_log', handleNewLog);

    return () => {
      socket.off('new_log', handleNewLog);
    };
  }, [filter, search]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const getLevelIcon = (level: string) => {
    const lowerLevel = level.toLowerCase();
    switch(lowerLevel) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const getLevelStyle = (level: string) => {
    const lowerLevel = level.toLowerCase();
    switch(lowerLevel) {
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'warn': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Registro de Eventos (Logs)
          <span className="flex h-2.5 w-2.5 relative ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar en logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 shadow-sm"
            />
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1.5 border border-slate-200 w-full sm:w-auto overflow-x-auto shadow-inner">
            {['all', 'info', 'warn', 'error'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level as any)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase shadow-sm ${
                  filter === level 
                    ? 'bg-white text-slate-800 shadow border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-none border border-transparent'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Hora</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nivel</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Mensaje</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => {
                const isExpanded = expandedLogId === log.id;
                const hasDetails = !!log.details;
                
                let formattedTime = log.timestamp;
                try {
                  formattedTime = format(parseISO(log.timestamp.replace(/Z$/, '')), 'dd/MM HH:mm:ss');
                } catch(e) {
                  // Fallback if parsing fails
                }

                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`transition-colors ${hasDetails ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'} ${isExpanded ? 'bg-slate-50' : ''}`}
                      onClick={() => hasDetails && toggleExpand(log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs font-medium">
                        {formattedTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm uppercase ${getLevelStyle(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 w-full font-medium">
                        <div className="flex flex-col">
                          <span>{log.message}</span>
                          {log.source && (
                            <span className="text-xs text-slate-400 font-mono mt-1">src: {log.source}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {hasDetails && (
                          <button 
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }}
                            title="Ver detalles"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto shadow-inner border border-slate-800">
                            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words">
                              {log.details}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50 font-medium">
                    No se encontraron logs para el filtro seleccionado.
                  </td>
                </tr>
              )}
              {isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Cargando logs...
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
