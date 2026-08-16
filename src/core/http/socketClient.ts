import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';

// Extract the base URL for the WebSocket connection by removing the '/api' path 
// or taking the origin of the API_BASE_URL.
const getSocketUrl = () => {
  try {
    const url = new URL(config.API_BASE_URL);
    return url.origin;
  } catch (e) {
    return config.API_BASE_URL.replace(/\/api$/, '');
  }
};

const SOCKET_URL = getSocketUrl();

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Fallback support
  autoConnect: true,
  // 1. Falta de Autenticación:
  // Si tu backend requiere el token para WebSockets, envíalo aquí.
  auth: {
    token: config.API_TOKEN
  },
  extraHeaders: {
    Authorization: `Bearer ${config.API_TOKEN}`
  }
  // 2. Problema de Rutas (Reverse Proxy):
  // Si Nginx/Apache solo redirige "/api" al backend, la ruta por defecto "/socket.io" fallará.
  // Descomenta y ajusta la siguiente línea si ese es el caso:
  // path: '/api/socket.io'
});

socket.on('connect', () => {
  console.log('✅ Conectado a WebSockets de AgroMap');
});

socket.on('disconnect', () => {
  console.warn('⚠️ Desconectado de WebSockets');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error conectando a WebSockets:', error);
});
