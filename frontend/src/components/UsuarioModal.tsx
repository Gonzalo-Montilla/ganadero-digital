import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, SquarePen, UserPlus } from 'lucide-react';
import { usuariosService } from '../api/usuarios';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import type { Usuario } from '../types/usuario';
import { ROL_OPTIONS } from '../types/usuario';

type UsuarioModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  usuario?: Usuario | null;
};

export default function UsuarioModal({ isOpen, onClose, onSave, usuario }: UsuarioModalProps) {
  const modalTitleId = 'usuario-modal-title';
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    documento: '',
    rol: 'operario',
    password: '',
    activo: true,
    recibir_notificaciones: true,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (usuario) {
      setFormData({
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        telefono: usuario.telefono || '',
        documento: usuario.documento || '',
        rol: usuario.rol,
        password: '',
        activo: usuario.activo,
        recibir_notificaciones: usuario.recibir_notificaciones,
      });
    } else {
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        documento: '',
        rol: 'operario',
        password: '',
        activo: true,
        recibir_notificaciones: true,
      });
    }
    setError('');
    setShowPassword(false);
  }, [usuario, isOpen]);

  useModalFocusTrap(isOpen, onClose, modalRef, initialFocusRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (usuario) {
        const payload: Record<string, string | boolean> = {
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          documento: formData.documento,
          activo: formData.activo,
          recibir_notificaciones: formData.recibir_notificaciones,
        };

        if (usuario.rol !== 'propietario') {
          payload.rol = formData.rol;
        }

        if (formData.password.trim()) {
          payload.password = formData.password;
        }

        await usuariosService.updateUsuario(usuario.id, payload);
      } else {
        if (!formData.password.trim()) {
          setError('La contraseña es obligatoria para usuarios nuevos');
          setLoading(false);
          return;
        }

        await usuariosService.createUsuario({
          email: formData.email,
          nombre_completo: formData.nombre_completo,
          password: formData.password,
          telefono: formData.telefono || undefined,
          documento: formData.documento || undefined,
          rol: formData.rol,
        });
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOwner = usuario?.rol === 'propietario';

  return (
    <div
      className="gd-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="gd-modal-panel gd-modal-surface max-h-[90vh] w-full max-w-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="gd-modal-body p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id={modalTitleId} className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              {usuario ? <SquarePen className="h-6 w-6 text-brand-700" /> : <UserPlus className="h-6 w-6 text-brand-700" />}
              {usuario ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre completo *</label>
              <input
                ref={initialFocusRef}
                required
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                className="gd-input"
                placeholder="Juan Perez"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Correo *</label>
              <input
                type="email"
                required
                readOnly={Boolean(usuario)}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`gd-input ${usuario ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder="usuario@finca.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Telefono</label>
                <input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="gd-input"
                  placeholder="300 123 4567"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Documento</label>
                <input
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  className="gd-input"
                  placeholder="CC o NIT"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Rol *</label>
              <select
                required
                disabled={isOwner}
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="gd-input disabled:bg-slate-50 disabled:text-slate-500"
              >
                {isOwner ? (
                  <option value="propietario">Propietario</option>
                ) : (
                  ROL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {usuario ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!usuario}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="gd-input pr-11"
                  placeholder={usuario ? 'Dejar vacio para no cambiar' : 'Minimo 6 caracteres'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {usuario ? (
              <div className="space-y-3">
                <label className="!mb-0 flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    disabled={isOwner}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Usuario activo</span>
                </label>
                <label className="!mb-0 flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.recibir_notificaciones}
                    onChange={(e) => setFormData({ ...formData, recibir_notificaciones: e.target.checked })}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Recibir alertas por correo</span>
                </label>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="gd-btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="gd-btn-primary disabled:opacity-60">
                {loading ? 'Guardando...' : usuario ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
