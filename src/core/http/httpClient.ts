import { config } from '../config/env';

export class HttpError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, data: any, message?: string) {
    super(message || `HTTP Error ${status}`);
    this.status = status;
    this.data = data;
    this.name = 'HttpError';
  }
}

export const httpClient = {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${config.API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${config.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new HttpError(response.status, errorData);
    }

    return response.json();
  },

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${config.API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.API_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new HttpError(response.status, errorData);
    }

    return response.json();
  }
};
