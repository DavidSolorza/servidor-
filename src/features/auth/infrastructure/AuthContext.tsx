import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función básica para ofuscar el estado de sesión en localStorage y hacerlo ilegible
const encodeToken = () => {
  const secret = import.meta.env.VITE_AUTH_SECRET_KEY || 'secret';
  return btoa(`${secret}:${new Date().getTime()}`);
};

const decodeToken = (token: string) => {
  try {
    const secret = import.meta.env.VITE_AUTH_SECRET_KEY || 'secret';
    const decoded = atob(token);
    return decoded.startsWith(secret);
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('secure_session_token');
    if (token) {
      return decodeToken(token);
    }
    return false;
  });

  const login = (password: string) => {
    // Verificar contra la contraseña del .env
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';
    if (password === validPassword) {
      localStorage.setItem('secure_session_token', encodeToken());
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('secure_session_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
