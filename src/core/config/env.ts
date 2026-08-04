export const config = {
  // Use the API URL from .env or fallback to the requested domain.
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://dashboard.servidor.blog/api',
};
