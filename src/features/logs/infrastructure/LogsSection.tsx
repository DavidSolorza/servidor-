import { useState } from 'react';
import { Search, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const LogsSection = ({ tenantName: _tenantName }: { tenantName: string }) => {
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  
  // Simulated logs data for demonstration
  const logs = [
    { id: 1, time: '10:42:05', level: 'ERROR', message: 'Failed to authenticate user via token.' },
    { id: 2, time: '10:41:12', level: 'INFO', message: 'Backup completed successfully.' },
    { id: 3, time: '10:39:55', level: 'WARN', message: 'High memory usage detected (85%).' },
    { id: 4, time: '10:35:10', level: 'INFO', message: 'New connection from IP 192.168.1.5' },
    { id: 5, time: '10:30:00', level: 'ERROR', message: 'Database deadlock detected on table "sectores"' },
    { id: 6, time: '10:15:22', level: 'INFO', message: 'Service restarted by administrator.' },
  ];

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.level === filter);

  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const getLevelStyle = (level: string) => {
    switch(level) {
      case 'ERROR': return 'bg-red-50 text-red-700 border-red-200';
      case 'WARN': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INFO': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Registro de Eventos (Logs)</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar en logs..." 
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 shadow-sm"
            />
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1.5 border border-slate-200 w-full sm:w-auto overflow-x-auto shadow-inner">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level as any)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs font-medium">
                    {log.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${getLevelStyle(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 w-full font-medium">
                    {log.message}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50 font-medium">
                    No se encontraron logs para el filtro seleccionado.
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
