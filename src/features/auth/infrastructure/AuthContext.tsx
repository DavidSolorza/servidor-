import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

const encodeToken = () => {
  const secret = import.meta.env.VITE_AUTH_SECRET_KEY || '';
  if (!secret) return '';
  const payload = JSON.stringify({
    created: Date.now(),
    secretHash: btoa(secret).split('').reverse().join(''),
  });
  return btoa(payload);
};

const decodeToken = (token: string) => {
  try {
    const secret = import.meta.env.VITE_AUTH_SECRET_KEY || '';
    if (!secret || !token) return false;
    
    const decodedText = atob(token);
    const payload = JSON.parse(decodedText);
    
    const expectedSecretHash = btoa(secret).split('').reverse().join('');
    if (payload.secretHash !== expectedSecretHash) return false;
    
    const isExpired = Date.now() - payload.created > SESSION_EXPIRATION_MS;
    if (isExpired) return false;

    return true;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('secure_session_token');
    if (token) {
      const valid = decodeToken(token);
      if (!valid) localStorage.removeItem('secure_session_token');
      return valid;
    }
    return false;
  });

  const login = (password: string) => {
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (!validPassword) {
      console.error("VITE_ADMIN_PASSWORD no está configurada.");
      return false;
    }
    if (password === validPassword) {
      const token = encodeToken();
      if (token) {
        localStorage.setItem('secure_session_token', token);
        setIsAuthenticated(true);
        return true;
      }
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
