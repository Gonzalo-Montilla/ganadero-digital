import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Animales from './pages/Animales';
import ControlSanitario from './pages/ControlSanitario';
import ControlReproductivo from './pages/ControlReproductivo';
import Produccion from './pages/Produccion';
import Transacciones from './pages/Transacciones';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
