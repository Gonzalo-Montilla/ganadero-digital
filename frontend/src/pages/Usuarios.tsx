import { useEffect, useState } from 'react';
import { ShieldAlert, UserCog } from 'lucide-react';
import AppShell from '../components/AppShell';
import UsuarioModal from '../components/UsuarioModal';
import UsuarioDetailsModal from '../components/UsuarioDetailsModal';
import UsuarioCard from '../components/cards/UsuarioCard';
import EntityCardGrid from '../components/cards/EntityCardGrid';
import { usuariosService } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types/usuario';

const ADMIN_ROLES = new Set(['propietario', 'admin']);

export default function UsuariosPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const canManage = user ? ADMIN_ROLES.has(user.rol) : false;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (canManage) {
      loadUsuarios();
    } else {
      setLoading(false);
    }
  }, [canManage]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await usuariosService.getUsuarios();
      setUsuarios(response.items);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const openDetails = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsDetailsOpen(true);
  };

  const openEdit = () => {
    setIsDetailsOpen(false);
    setIsModalOpen(true);
  };

  return (
    <AppShell
      title="Usuarios"
      subtitle="Toca una tarjeta para ver detalle o editar"
      userName={user?.nombre_completo}
      role={user?.rol}
      onLogout={logout}
      online={isOnline}
      rightSlot={
        canManage ? (
          <button onClick={openCreateModal} className="gd-btn-primary !py-2">
            + Nuevo usuario
          </button>
        ) : null
      }
    >
      {!canManage ? (
        <div className="gd-card mx-auto max-w-xl p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">Acceso restringido</h2>
          <p className="mt-2 text-sm text-slate-600">
            Solo propietarios y administradores pueden gestionar usuarios.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="gd-card overflow-hidden">
            <EntityCardGrid
              loading={loading}
              empty={!loading && usuarios.length === 0}
              emptyMessage="Aún no hay usuarios registrados"
              emptyAction={
                <button type="button" onClick={openCreateModal} className="font-semibold text-brand-600">
                  + Crear el primer usuario
                </button>
              }
            >
              {usuarios.map((usuario) => (
                <UsuarioCard key={usuario.id} usuario={usuario} onClick={() => openDetails(usuario)} />
              ))}
            </EntityCardGrid>

            {!loading && usuarios.length === 0 ? (
              <div className="pb-8 text-center">
                <UserCog className="mx-auto h-10 w-10 text-brand-700 opacity-50" />
              </div>
            ) : null}
          </div>
        </div>
      )}

      <UsuarioDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        usuario={selectedUsuario}
        onEdit={openEdit}
      />
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadUsuarios}
        usuario={selectedUsuario}
      />
    </AppShell>
  );
}
