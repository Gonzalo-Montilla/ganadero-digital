import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import AnimalCarnetHeader from './AnimalCarnetHeader';

export interface DetailAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'brand';
  hidden?: boolean;
}

export interface AnimalCarnetInfo {
  fotoUrl?: string | null;
  numero: string;
  nombre?: string | null;
}

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: { label: string; className: string };
  animalCarnet?: AnimalCarnetInfo;
  headerCaption?: string;
  headerSubcaption?: string;
  children: ReactNode;
  actions?: DetailAction[];
}

const actionClass: Record<NonNullable<DetailAction['variant']>, string> = {
  primary: 'gd-btn-primary !py-2.5',
  secondary: 'gd-btn-secondary !py-2.5',
  danger: 'gd-btn-danger !py-2.5',
  success: 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition',
  brand: 'gd-btn-primary !py-2.5',
};

export default function RecordDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  animalCarnet,
  headerCaption,
  headerSubcaption,
  children,
  actions = [],
}: RecordDetailModalProps) {
  if (!isOpen) return null;

  const visibleActions = actions.filter((a) => !a.hidden);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          {animalCarnet ? (
            <div className="min-w-0 pr-4">
              <AnimalCarnetHeader
                fotoUrl={animalCarnet.fotoUrl}
                numero={animalCarnet.numero}
                nombre={animalCarnet.nombre}
                badge={badge}
              />
              {headerCaption ? (
                <p className="mt-2 truncate text-sm font-semibold text-slate-800">{headerCaption}</p>
              ) : null}
              {headerSubcaption ? <p className="mt-0.5 text-xs text-slate-500">{headerSubcaption}</p> : null}
            </div>
          ) : (
            <div className="min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                {badge ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                ) : null}
              </div>
              {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
          )}
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {visibleActions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
            {visibleActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={actionClass[action.variant ?? 'secondary']}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}

RecordDetailModal.Row = DetailRow;
