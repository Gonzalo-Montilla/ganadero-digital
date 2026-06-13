import EntityCard from './EntityCard';
import type { Usuario } from '../../types/usuario';
import { ROL_LABELS } from '../../types/usuario';
import { UserCog } from 'lucide-react';

interface Props {
  usuario: Usuario;
  onClick: () => void;
}

export default function UsuarioCard({ usuario, onClick }: Props) {
  const initials = usuario.nombre_completo
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <EntityCard
      onClick={onClick}
      title={usuario.nombre_completo}
      subtitle={usuario.email}
      meta={[ROL_LABELS[usuario.rol] || usuario.rol]}
      badge={{
        label: usuario.activo ? 'activo' : 'inactivo',
        className: usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
      }}
      media={
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
          {initials ? (
            <span className="text-2xl font-bold text-brand-700">{initials}</span>
          ) : (
            <UserCog className="h-10 w-10 text-brand-700" />
          )}
        </div>
      }
    />
  );
}
