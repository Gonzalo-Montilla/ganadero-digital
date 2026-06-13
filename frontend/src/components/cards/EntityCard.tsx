import type { MouseEvent, ReactNode } from 'react';

export interface EntityCardBadge {
  label: string;
  className: string;
}

interface EntityCardProps {
  onClick: () => void;
  title: string;
  subtitle?: string;
  meta?: string[];
  badge?: EntityCardBadge;
  media?: ReactNode;
  footer?: ReactNode;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (e: MouseEvent) => void;
}

export default function EntityCard({
  onClick,
  title,
  subtitle,
  meta = [],
  badge,
  media,
  footer,
  selectable,
  selected,
  onSelectToggle,
}: EntityCardProps) {
  return (
    <article
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md ${
        selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {selectable ? (
        <div
          className="absolute left-2 top-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle?.(e);
          }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => undefined}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            aria-label={`Seleccionar ${title}`}
          />
        </div>
      ) : null}

      {media ? (
        <div className="relative h-32 w-full overflow-hidden bg-slate-100">{media}</div>
      ) : null}

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          {badge ? (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>

        {meta.length > 0 ? (
          <ul className="mt-2 space-y-0.5">
            {meta.map((line) => (
              <li key={line} className="truncate text-xs text-slate-600">
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
      </div>
    </article>
  );
}
