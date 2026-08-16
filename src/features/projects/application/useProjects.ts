import { useState, useEffect } from 'react';
import { httpClient } from '../../../core/http/httpClient';
import type { Project, ProjectsResponse } from '../domain/Project';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      // Fetch projects and metrics simultaneously
      const [projectsRes, metricsRes] = await Promise.all([
        httpClient.get<ProjectsResponse>('/projects'),
        httpClient.get<any>('/metrics/projects').catch(() => null)
      ]);
      
      let projectsList = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []);
      const rawMetrics = metricsRes?.data || metricsRes;
      const metricsData = rawMetrics?.by_project;
      const globalServer = rawMetrics?.server || rawMetrics;

      projectsList = projectsList.map((proj: Project) => {
        const apiSlug = proj.api_base ? proj.api_base.replace(/^\/api\//, '') : '';
        let stats = undefined;
        if (metricsData) {
          stats = metricsData[proj.name] || (apiSlug ? metricsData[apiSlug] : undefined) || metricsData['general'];
        }
        if (!stats && globalServer) {
          stats = {
            total_requests: globalServer.total_requests || 0,
            success_2xx: globalServer.success_2xx || 0,
            client_errors_4xx: globalServer.client_errors_4xx || 0,
            server_errors_5xx: globalServer.server_errors_5xx || 0,
            last_request_time: globalServer.last_request_time || ''
          };
        }
        return {
          ...proj,
          stats
        };
      });

      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(() => {
      fetchProjects(false);
    }, 5000); // Polling every 5 seconds without showing the full loader
    return () => clearInterval(interval);
  }, []);

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects
  };
};
