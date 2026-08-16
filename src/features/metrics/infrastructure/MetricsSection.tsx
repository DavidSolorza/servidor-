import { useState, useEffect } from 'react';
import { httpClient } from '../../../core/http/httpClient';
import { socket } from '../../../core/http/socketClient';
import { Activity, Zap, AlertTriangle, Wifi, Server, ArrowDownUp, Cpu, Database, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface MetricsData {
  server: {
    status: string;
    uptime_seconds: number;
    total_requests: number;
    success_2xx: number;
    client_errors_4xx: number;
    server_errors_5xx: number;
    by_project?: Record<string, any>;
  };
  hardware?: {
    cpu_percent: number;
    cpu_cores: number;
    ram_total_mb: number;
    ram_used_mb: number;
    ram_free_mb: number;
    ram_percent: number;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_free_gb: number;
    disk_percent: number;
    process_memory_mb: number;
  };
  tunnel: {
    domain: string;
    ha_connections: number;
    total_requests?: number;
    total_errors?: number;
    latency_ms: number;
    bytes_received: number;
    bytes_sent: number;
  };
}

interface HistoryData {
  timestamp: string;
  cpu_percent: number;
  ram_percent: number;
  total_requests: number;
  latency_ms: number;
  timeLabel?: string;
}

export const MetricsSection = ({ tenantName }: { tenantName: string }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [tenantStats, setTenantStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pingMs, setPingMs] = useState<number>(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const startTime = performance.now();
        // Fetch current metrics
        const res = await httpClient.get<any>(`/system/metrics`);
        const latency = Math.max(1, Math.round(performance.now() - startTime));
        setPingMs(latency);

        const data = res?.data?.data || res?.data || res;
        
        if (data && data.server) {
          setMetrics(data as MetricsData);
          const byProj = data.server.by_project;
          const matched = byProj?.[tenantName] || byProj?.[tenantName.toLowerCase()] || byProj?.['general'] || null;
          setTenantStats(matched);
        }

        let histData = [];
        try {
          const histRes = await httpClient.get<any>(`/system/metrics/history?limit=30`);
          histData = histRes?.data?.data || histRes?.data || [];
        } catch (e) {
          console.warn('History endpoint returned an error (likely 404). Backend might not be updated yet.');
        }

        if (Array.isArray(histData)) {
          // Format timestamps for the chart
          const formattedHistory = histData.map((pt: any) => {
            let timeStr = pt.timestamp;
            try {
              timeStr = format(parseISO(pt.timestamp.replace(/Z$/, '')), 'HH:mm:ss');
            } catch (e) {
              // fallback
            }
            return {
              ...pt,
              latency_ms: pt.latency_ms && pt.latency_ms > 0 ? pt.latency_ms : (latency || 110),
              timeLabel: timeStr
            };
          }).reverse(); // Ascending order for charts usually
          setHistory(formattedHistory);
        }

      } catch (error) {
        console.error('Error fetching metrics', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    
    const handleMetricsUpdate = (raw: any) => {
      const data = raw?.data?.data || raw?.data || raw;
      if (data && data.server) {
        setMetrics(data as MetricsData);
        const byProj = data.server.by_project;
        const matched = byProj?.[tenantName] || byProj?.[tenantName.toLowerCase()] || byProj?.['general'] || null;
        setTenantStats(matched);

        // Add to history
        setHistory(prev => {
          let timeStr = data.timestamp || new Date().toISOString();
          try {
            timeStr = format(parseISO(timeStr.replace(/Z$/, '')), 'HH:mm:ss');
          } catch(e) {}
          
          const pointLatency = data.tunnel?.latency_ms && data.tunnel.latency_ms > 0 ? data.tunnel.latency_ms : (pingMs || 110);

          const newPoint = {
            ...data,
            total_requests: data.server.total_requests || 0,
            latency_ms: pointLatency,
            timeLabel: timeStr
          };
          
          const nextHistory = [...prev, newPoint];
          if (nextHistory.length > 60) return nextHistory.slice(nextHistory.length - 60);
          return nextHistory;
        });
      }
    };

    socket.on('metrics_update', handleMetricsUpdate);

    return () => {
      clearInterval(interval);
      socket.off('metrics_update', handleMetricsUpdate);
    };
  }, [tenantName, pingMs]);

  if (isLoading && !metrics) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-50/50 rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cards = [
    {
      title: 'Conexiones HA Túnel',
      value: metrics?.tunnel?.ha_connections || 0,
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-100'
    },
    {
      title: 'Peticiones Servidor',
      value: tenantStats ? tenantStats.total_requests : (metrics?.server?.total_requests || 0),
      icon: <Server className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-100'
    },
    {
      title: 'Latencia (Ping)',
      value: `${(metrics?.tunnel?.latency_ms && metrics.tunnel.latency_ms > 0) ? metrics.tunnel.latency_ms : (pingMs || 110)} ms`,
      icon: <Wifi className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-100'
    },
    {
      title: 'Errores (4xx / 5xx)',
      value: tenantStats 
        ? (tenantStats.client_errors_4xx || 0) + (tenantStats.server_errors_5xx || 0)
        : (metrics?.server?.client_errors_4xx || 0) + (metrics?.server?.server_errors_5xx || 0),
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50 border-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        Métricas en Tiempo Real
        <span className="flex h-2.5 w-2.5 relative ml-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </h2>
      
      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`p-5 rounded-xl border ${card.color} transition-all`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-semibold text-slate-600">{card.title}</span>
              <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Historial (Gráfico) y Hardware */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Tráfico/Latencia */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Evolución de Tráfico y Latencia</h3>
          <div className="flex-1 min-h-[250px]">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                  />
                  <Area yAxisId="left" type="monotone" name="Peticiones Totales" dataKey="total_requests" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                  <Area yAxisId="right" type="monotone" name="Latencia (ms)" dataKey="latency_ms" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-slate-400">
                Esperando datos históricos...
              </div>
            )}
          </div>
        </div>

        {/* Recursos de Hardware */}
        <div className="p-6 bg-slate-900 border border-slate-800 shadow-lg rounded-xl flex flex-col text-white">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Recursos del Sistema
          </h3>
          
          <div className="space-y-6 flex-1">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" /> CPU ({metrics?.hardware?.cpu_cores || 0} Cores)
                </span>
                <span className="text-white font-bold">{metrics?.hardware?.cpu_percent || 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  (metrics?.hardware?.cpu_percent || 0) > 80 ? 'bg-red-500' : 
                  (metrics?.hardware?.cpu_percent || 0) > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                }`} style={{ width: `${metrics?.hardware?.cpu_percent || 0}%` }}></div>
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" /> Memoria RAM
                </span>
                <span className="text-white font-bold">{metrics?.hardware?.ram_percent || 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full ${
                  (metrics?.hardware?.ram_percent || 0) > 85 ? 'bg-red-500' : 
                  (metrics?.hardware?.ram_percent || 0) > 65 ? 'bg-amber-400' : 'bg-blue-400'
                }`} style={{ width: `${metrics?.hardware?.ram_percent || 0}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                {metrics?.hardware?.ram_used_mb ? (metrics.hardware.ram_used_mb / 1024).toFixed(1) : 0} GB / {metrics?.hardware?.ram_total_mb ? (metrics.hardware.ram_total_mb / 1024).toFixed(1) : 0} GB
              </div>
            </div>

            {/* Disco */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-400" /> Disco
                </span>
                <span className="text-white font-bold">{metrics?.hardware?.disk_percent || 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${metrics?.hardware?.disk_percent || 0}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                {metrics?.hardware?.disk_used_gb?.toFixed(1) || 0} GB / {metrics?.hardware?.disk_total_gb?.toFixed(1) || 0} GB
              </div>
            </div>
            
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700/50">
             <div className="flex justify-between items-center text-xs text-slate-400">
               <span>Proceso Servidor (Flask)</span>
               <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                 {metrics?.hardware?.process_memory_mb?.toFixed(1) || 0} MB
               </span>
             </div>
          </div>
        </div>

      </div>

      {/* Detalles del Túnel y Servidor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel del Túnel Cloudflare */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-100">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Túnel de Cloudflare</h3>
              <p className="text-xs text-slate-500 font-medium">{metrics?.tunnel?.domain || 'Desconocido'}</p>
            </div>
          </div>
          
          <div className="space-y-5 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ArrowDownUp className="w-4 h-4" /> Tráfico Recibido
                </span>
                <span className="text-slate-800 font-bold">{formatBytes(metrics?.tunnel?.bytes_received || 0)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ArrowDownUp className="w-4 h-4" /> Tráfico Enviado
                </span>
                <span className="text-slate-800 font-bold">{formatBytes(metrics?.tunnel?.bytes_sent || 0)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 mt-auto">
              <span className="text-sm font-medium text-slate-600">Peticiones Totales del Túnel</span>
              <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                {metrics?.tunnel?.total_requests || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Panel del Servidor Flask (Específico del Tenant) */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <Server className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">Actividad de {tenantName.toUpperCase()}</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                Status Global: 
                <span className={`font-bold ${metrics?.server?.status === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metrics?.server?.status || 'desconocido'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800 mb-1">
                {tenantStats ? tenantStats.success_2xx : (metrics?.server?.success_2xx || 0)}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Éxitos 2xx</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-lg font-bold text-slate-800 mb-1 flex items-center justify-center h-8 text-[11px] leading-tight">
                {tenantStats?.last_request_time ? tenantStats.last_request_time.split(' ')[1] : (metrics?.server?.uptime_seconds ? `${metrics.server.uptime_seconds}s up` : '-')}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {tenantStats ? 'Última Petición' : 'Uptime Global'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mt-auto">
            <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
              <span className="text-sm font-medium text-red-700">Errores de Cliente (4xx)</span>
              <span className="font-bold text-red-600 bg-white px-2.5 py-1 rounded-md border border-red-200 shadow-sm">
                {tenantStats ? (tenantStats.client_errors_4xx || 0) : (metrics?.server?.client_errors_4xx || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
              <span className="text-sm font-medium text-red-700">Errores de Servidor (5xx)</span>
              <span className="font-bold text-red-600 bg-white px-2.5 py-1 rounded-md border border-red-200 shadow-sm">
                {tenantStats ? (tenantStats.server_errors_5xx || 0) : (metrics?.server?.server_errors_5xx || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
