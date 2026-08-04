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
      
      let projectsList = projectsRes?.data || [];
      const metricsData = metricsRes?.data?.by_project || metricsRes?.by_project;

      if (metricsData) {
        projectsList = projectsList.map((proj: Project) => ({
          ...proj,
          stats: metricsData[proj.name] || undefined
        }));
      }

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
