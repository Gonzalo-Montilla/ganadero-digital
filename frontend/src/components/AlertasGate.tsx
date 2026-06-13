import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { alertasService, type Alerta } from '../api/alertas';
import { useAuth } from '../context/AuthContext';
import { filtrarAlertasNoLeidas } from '../utils/alertasLeidas';
import AlertasIngresoModal from './AlertasIngresoModal';

interface AlertasGateProps {
  children: ReactNode;
}

export default function AlertasGate({ children }: AlertasGateProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [alertasPendientes, setAlertasPendientes] = useState<Alerta[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [revisadoEnSesion, setRevisadoEnSesion] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setRevisadoEnSesion(false);
      setModalAbierto(false);
      setAlertasPendientes([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading || !isAuthenticated || !user || location.pathname === '/login') {
      return;
    }

    if (revisadoEnSesion) {
      return;
    }

    let cancelado = false;

    const cargarAlertas = async () => {
      try {
        const alertas = await alertasService.getAlertas();
        const sinLeer = filtrarAlertasNoLeidas(user.id, alertas);
        if (cancelado) return;

        if (sinLeer.length > 0) {
          setAlertasPendientes(sinLeer);
          setModalAbierto(true);
        } else {
          setRevisadoEnSesion(true);
        }
      } catch {
        if (!cancelado) {
          setRevisadoEnSesion(true);
        }
      }
    };

    void cargarAlertas();

    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, loading, user, location.pathname, revisadoEnSesion]);

  const handleComplete = () => {
    setModalAbierto(false);
    setAlertasPendientes([]);
    setRevisadoEnSesion(true);
  };

  return (
    <>
      {children}
      {user ? (
        <AlertasIngresoModal
          isOpen={modalAbierto}
          alertas={alertasPendientes}
          userId={user.id}
          onComplete={handleComplete}
        />
      ) : null}
    </>
  );
}
