import { useProjects } from '../application/useProjects';
import { Database, RefreshCw, AlertCircle, HardDrive, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/infrastructure/AuthContext';

export const ProjectsView = () => {
  const { projects, isLoading, error, refresh } = useProjects();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Supervisión y Control Multi-Tenant</h1>
          <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-sm shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 font-medium">Conectado a Cloudflare</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium rounded-lg transition-all"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Bases de Datos Activas</h2>
          <p className="text-slate-500 text-lg">Selecciona un tenant para gestionar sus métricas, logs, tablas y copias de seguridad.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3 mb-8 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error de conexión</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {isLoading && !projects.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-40 border border-slate-200 shadow-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.name}
                onClick={() => navigate(`/tenant/${project.name}`)}
                className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer overflow-hidden hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)] hover:-translate-y-1 shadow-sm flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {project.title || project.name.toUpperCase()}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        id: {project.name} {project.api_base && `• endpoint: ${project.api_base}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Operativo
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-500" />
                      Motor / BD:
                    </span>
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {project.database_type || project.db_file || 'SQLite'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-slate-500 font-medium">
                        Peticiones: <span className="text-slate-800 font-bold ml-1 text-sm">{project.stats?.total_requests ?? 0}</span>
                      </div>
                      {project.stats?.last_request_time && (
                        <div className="text-[10px] text-slate-400">
                          Última: {project.stats.last_request_time}
                        </div>
                      )}
                    </div>
                    
                    {(project.stats?.client_errors_4xx || project.stats?.server_errors_5xx) ? (
                      <div className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100 shadow-sm whitespace-nowrap">
                        {(project.stats.client_errors_4xx || 0) + (project.stats.server_errors_5xx || 0)} errores
                      </div>
                    ) : (
                      <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm whitespace-nowrap">
                        0 errores
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && !isLoading && !error && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-slate-500 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                <Database className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin bases de datos</h3>
                <p>No se encontraron proyectos registrados en el servidor.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
