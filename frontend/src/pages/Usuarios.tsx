import { useEffect, useState } from 'react';
import { ShieldAlert, UserCog } from 'lucide-react';
import AppShell from '../components/AppShell';
import UsuarioModal from '../components/UsuarioModal';
import { usuariosService } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import type { Usuario } from '../types/usuario';
import { ROL_LABELS } from '../types/usuario';

const ADMIN_ROLES = new Set(['propietario', 'admin']);

export default function UsuariosPage() {
  const { user, logout } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const canManage = user ? ADMIN_ROLES.has(user.rol) : false;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  return (
    <AppShell
      title="Usuarios"
      subtitle="Crea y administra el equipo de la finca"
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
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                <UserCog className="mx-auto mb-3 h-10 w-10 text-brand-700" />
                <p className="font-semibold text-slate-800">Aun no hay usuarios registrados</p>
                <p className="mt-1 text-sm">Crea el primer usuario del equipo.</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nombre</th>
                        <th className="px-4 py-3 font-semibold">Correo</th>
                        <th className="px-4 py-3 font-semibold">Rol</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{usuario.nombre_completo}</td>
                          <td className="px-4 py-3 text-slate-700">{usuario.email}</td>
                          <td className="px-4 py-3">
                            <span className="gd-pill bg-brand-100 text-brand-800">
                              {ROL_LABELS[usuario.rol] || usuario.rol}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`gd-pill ${usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openEditModal(usuario)} className="gd-btn-secondary !px-3 !py-1.5 text-xs">
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {usuarios.map((usuario) => (
                    <article key={usuario.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{usuario.nombre_completo}</h3>
                          <p className="text-sm text-slate-600">{usuario.email}</p>
                        </div>
                        <span className={`gd-pill ${usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="gd-pill bg-brand-100 text-brand-800">{ROL_LABELS[usuario.rol] || usuario.rol}</span>
                        <button onClick={() => openEditModal(usuario)} className="gd-btn-secondary !px-3 !py-1.5 text-xs">
                          Editar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadUsuarios}
        usuario={selectedUsuario}
      />
    </AppShell>
  );
}
