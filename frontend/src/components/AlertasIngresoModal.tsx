import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Clock,
  HeartPulse,
  Milk,
  ShieldAlert,
  Siren,
  TrendingDown,
} from 'lucide-react';
import type { Alerta } from '../api/alertas';
import { getRutaAlertaDetalle } from '../api/alertas';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { marcarAlertaLeida } from '../utils/alertasLeidas';

interface AlertasIngresoModalProps {
  isOpen: boolean;
  alertas: Alerta[];
  userId: number;
  onComplete: () => void;
}

function getPrioridadStyles(prioridad: Alerta['prioridad']) {
  switch (prioridad) {
    case 'alta':
      return {
        panel: 'border-red-300 bg-red-50',
        badge: 'bg-red-600 text-white',
        ring: 'ring-red-200',
        urgencia: 'text-red-700 bg-red-100',
      };
    case 'media':
      return {
        panel: 'border-amber-300 bg-amber-50',
        badge: 'bg-amber-600 text-white',
        ring: 'ring-amber-200',
        urgencia: 'text-amber-800 bg-amber-100',
      };
    default:
      return {
        panel: 'border-sky-300 bg-sky-50',
        badge: 'bg-sky-600 text-white',
        ring: 'ring-sky-200',
        urgencia: 'text-sky-800 bg-sky-100',
      };
  }
}

function getTipoIcon(tipo: Alerta['tipo']) {
  switch (tipo) {
    case 'parto':
      return Milk;
    case 'vacuna':
      return HeartPulse;
    case 'sanitario':
      return ShieldAlert;
    case 'reproductivo':
      return Siren;
    case 'retiro_sanitario':
      return AlertTriangle;
    case 'dias_abiertos':
      return TrendingDown;
    default:
      return Bell;
  }
}

export default function AlertasIngresoModal({
  isOpen,
  alertas,
  userId,
  onComplete,
}: AlertasIngresoModalProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
    }
  }, [isOpen, alertas]);

  const current = alertas[index];
  const total = alertas.length;
  const isLast = index >= total - 1;
  const progreso = total > 0 ? ((index + 1) / total) * 100 : 0;

  useModalFocusTrap(isOpen, () => undefined, modalRef, confirmRef);

  if (!isOpen || !current || total === 0) {
    return null;
  }

  const styles = getPrioridadStyles(current.prioridad);
  const Icon = getTipoIcon(current.tipo);
  const animalLabel = current.animal_nombre || current.animal_numero || 'Animal';
  const fechaLabel = current.tieneFechaLimite
    ? new Date(current.fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const avanzar = (irModulo = false) => {
    marcarAlertaLeida(userId, current.id);

    if (irModulo) {
      navigate(getRutaAlertaDetalle(current));
      onComplete();
      return;
    }

    if (isLast) {
      onComplete();
      return;
    }

    setIndex((prev) => prev + 1);
  };

  return (
    <div
      className="gd-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alertas-ingreso-title"
        className={`gd-modal-panel gd-modal-surface w-full max-w-lg ring-2 ${styles.ring}`}
      >
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-700" aria-hidden />
              <p className="text-sm font-semibold text-slate-600">
                Alerta {index + 1} de {total}
              </p>
            </div>
            <span className={`gd-pill text-xs font-bold uppercase ${styles.badge}`}>
              Prioridad {current.prioridad}
            </span>
          </div>

          {total > 1 ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          ) : null}

          <h2 id="alertas-ingreso-title" className="mt-3 text-xl font-extrabold text-slate-900">
            Requiere tu atención
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Lee cada alerta y confirma con &quot;Entendido&quot; para continuar en el sistema.
          </p>
        </div>

        <div className={`mx-6 mt-5 rounded-2xl border p-5 ${styles.panel}`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <Icon className="h-6 w-6 text-slate-800" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900">{current.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{current.descripcionCorta}</p>

              <div
                className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${styles.urgencia}`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {current.urgenciaTexto}
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Animal:</span> {animalLabel}
                  {current.animal_numero && current.animal_nombre ? ` (#${current.animal_numero})` : ''}
                </p>
                {fechaLabel ? (
                  <p>
                    <span className="font-semibold text-slate-800">Fecha límite:</span> {fechaLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => avanzar(true)}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ir a revisar
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => avanzar(false)}
            className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            {isLast ? 'Entendido, continuar' : 'Entendido, siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
