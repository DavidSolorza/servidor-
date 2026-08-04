import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertOctagon, Table, HardDrive, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/infrastructure/AuthContext';
import { MetricsSection } from '../../metrics/infrastructure/MetricsSection';
import { LogsSection } from '../../logs/infrastructure/LogsSection';
import { TablesSection } from '../../tables/infrastructure/TablesSection';
import { BackupsSection } from '../../backups/infrastructure/BackupsSection';

export const TenantDashboardView = () => {
  const { tenantName } = useParams<{ tenantName: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'tables' | 'backups'>('metrics');

  const tabs = [
    { id: 'metrics', label: 'Métricas', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'logs', label: 'Errores y Logs', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'tables', label: 'Visor de Tablas', icon: <Table className="w-4 h-4" /> },
    { id: 'backups', label: 'Copias de Seguridad', icon: <HardDrive className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{tenantName?.toUpperCase()}</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 shadow-sm hidden sm:inline-block">
              Tenant Activo
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium hidden sm:block">Panel de control y supervisión</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium rounded-lg transition-all"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4 hidden md:block">
          <nav className="space-y-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="md:hidden border-b border-slate-200 bg-white p-3 flex overflow-x-auto gap-2 shadow-sm">
           {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto pb-12">
            {activeTab === 'metrics' && <MetricsSection tenantName={tenantName!} />}
            {activeTab === 'logs' && <LogsSection tenantName={tenantName!} />}
            {activeTab === 'tables' && <TablesSection tenantName={tenantName!} />}
            {activeTab === 'backups' && <BackupsSection tenantName={tenantName!} />}
          </div>
        </main>
      </div>
    </div>
  );
};
