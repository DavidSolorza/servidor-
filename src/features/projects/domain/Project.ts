export interface Project {
  name: string;
  title?: string;
  description?: string;
  database_type?: string;
  api_base?: string;
  db_file?: string;
  tables_url: string;
  stats?: {
    total_requests: number;
    success_2xx: number;
    client_errors_4xx: number;
    server_errors_5xx: number;
    last_request_time: string;
  };
}

export interface ProjectsResponse {
  data: Project[];
}

