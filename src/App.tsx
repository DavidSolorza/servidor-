import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectsView } from './features/projects/infrastructure/ProjectsView';
import { TenantDashboardView } from './features/dashboard/infrastructure/TenantDashboardView';
import { LoginView } from './features/auth/infrastructure/LoginView';
import { ProtectedRoute } from './features/auth/infrastructure/ProtectedRoute';
import { AuthProvider } from './features/auth/infrastructure/AuthContext';
import { ToastProvider } from './features/ui/infrastructure/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsView />} />
              <Route path="/tenant/:tenantName" element={<TenantDashboardView />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
