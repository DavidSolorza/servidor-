import { useState } from 'react';
import { HardDrive, Download, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../ui/infrastructure/ToastProvider';

export const BackupsSection = ({ tenantName }: { tenantName: string }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const toast = useToast();
  const [backups, setBackups] = useState([
    { id: 1, name: `${tenantName}_backup_20231024.db`, date: '2023-10-24 02:00:00', size: '42.5 MB' },
    { id: 2, name: `${tenantName}_backup_20231023.db`, date: '2023-10-23 02:00:00', size: '41.2 MB' },
    { id: 3, name: `${tenantName}_backup_20231022.db`, date: '2023-10-22 02:00:00', size: '40.8 MB' },
  ]);

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    toast.info('Iniciando creación del backup...');
    // Simulate API POST request
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        name: `${tenantName}_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_manual.db`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        size: '45.1 MB'
      };
      setBackups([newBackup, ...backups]);
      setIsBackingUp(false);
      toast.success('Copia de seguridad creada correctamente');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-purple-600" />
          Copias de Seguridad
        </h2>
        
        <button
          onClick={handleCreateBackup}
          disabled={isBackingUp}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-wait shadow-sm shadow-purple-500/20"
        >
          {isBackingUp ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          {isBackingUp ? 'Creando Backup...' : 'Crear Backup Ahora'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-sm text-slate-600 font-medium">
          <InfoIcon /> Los backups manuales y programados se almacenan en el disco del servidor.
        </div>
        
        <div className="divide-y divide-slate-100">
          {backups.map(backup => (
            <div key={backup.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-1 sm:mt-0 shadow-sm">
                  <DatabaseIcon />
                </div>
                <div>
                  <h4 className="text-slate-800 font-bold mb-1 text-base">{backup.name}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {backup.date}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 shadow-sm">
                      {backup.size}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Exitoso
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 text-sm font-bold rounded-lg transition-all w-full sm:w-auto justify-center">
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pequeños íconos de ayuda
const InfoIcon = () => (
  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);
