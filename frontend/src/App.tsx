import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AlertasGate from './components/AlertasGate';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Metricas from './pages/Metricas';
import Animales from './pages/Animales';
import ControlSanitario from './pages/ControlSanitario';
import ControlReproductivo from './pages/ControlReproductivo';
import Produccion from './pages/Produccion';
import Transacciones from './pages/Transacciones';
import Usuarios from './pages/Usuarios';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="gd-card p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Cargando tu finca...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function RoleRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="gd-card p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Cargando tu finca...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user || !roles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertasGate>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/metricas"
            element={
              <PrivateRoute>
                <Metricas />
              </PrivateRoute>
            }
          />
          <Route
            path="/animales"
            element={
              <PrivateRoute>
                <Animales />
              </PrivateRoute>
            }
          />
          <Route
            path="/control-sanitario"
            element={
              <PrivateRoute>
                <ControlSanitario />
              </PrivateRoute>
            }
          />
          <Route
            path="/control-reproductivo"
            element={
              <PrivateRoute>
                <ControlReproductivo />
              </PrivateRoute>
            }
          />
          <Route
            path="/produccion"
            element={
              <PrivateRoute>
                <Produccion />
              </PrivateRoute>
            }
          />
          <Route
            path="/transacciones"
            element={
              <PrivateRoute>
                <Transacciones />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RoleRoute roles={['propietario', 'admin']}>
                <Usuarios />
              </RoleRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </AlertasGate>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
