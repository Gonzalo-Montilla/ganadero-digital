import type { ReactNode } from 'react';

interface EntityCardGridProps {
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}

export default function EntityCardGrid({
  loading,
  empty,
  emptyMessage = 'Sin registros',
  emptyAction,
  children,
}: EntityCardGridProps) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600" />
        <p className="mt-4 text-sm text-slate-600">Cargando...</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}
