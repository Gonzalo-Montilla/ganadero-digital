import { UserCog } from 'lucide-react';
import RecordDetailModal from './cards/RecordDetailModal';
import type { Usuario } from '../types/usuario';
import { ROL_LABELS } from '../types/usuario';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  onEdit: () => void;
}

export default function UsuarioDetailsModal({ isOpen, onClose, usuario, onEdit }: Props) {
  if (!usuario) return null;

  return (
    <RecordDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={usuario.nombre_completo}
      subtitle={usuario.email}
      badge={{
        label: usuario.activo ? 'Activo' : 'Inactivo',
        className: usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
      }}
      actions={[{ label: 'Editar', onClick: onEdit, variant: 'brand' }]}
    >
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <UserCog className="h-10 w-10" />
        </div>
      </div>
      <dl>
        <RecordDetailModal.Row label="Rol" value={ROL_LABELS[usuario.rol] || usuario.rol} />
        <RecordDetailModal.Row label="Correo" value={usuario.email} />
        <RecordDetailModal.Row label="Estado" value={usuario.activo ? 'Activo' : 'Inactivo'} />
      </dl>
    </RecordDetailModal>
  );
}
