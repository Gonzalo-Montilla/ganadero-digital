import type { ReactNode } from 'react';

import { NavLink } from 'react-router-dom';

import { Activity, BarChart3, HeartPulse, Home, PieChart, Repeat2, Users, Wallet } from 'lucide-react';

import InstallAppButton from './InstallAppButton';

import SyncStatusBadge from './SyncStatusBadge';

import BrandMark from './BrandMark';



type AppShellProps = {

  title: string;

  subtitle?: string;

  userName?: string;

  role?: string;

  online?: boolean;

  onLogout?: () => void;

  rightSlot?: ReactNode;

  children: ReactNode;

};



const navItems = [

  { to: '/dashboard', label: 'Inicio', Icon: Home },

  { to: '/metricas', label: 'Metricas', Icon: PieChart },

  { to: '/animales', label: 'Animales', Icon: Activity },

  { to: '/control-sanitario', label: 'Sanidad', Icon: HeartPulse },

  { to: '/control-reproductivo', label: 'Reproductivo', Icon: Repeat2 },

  { to: '/produccion', label: 'Produccion', Icon: BarChart3 },

  { to: '/transacciones', label: 'Finanzas', Icon: Wallet },

  { to: '/usuarios', label: 'Usuarios', Icon: Users, roles: ['propietario', 'admin'] as const },

];



function navLinkClass(isActive: boolean, compact = false) {

  if (compact) {

    return [

      'relative flex min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold transition',

      isActive ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800',

    ].join(' ');

  }



  return [

    'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition',

    isActive

      ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-200 ring-offset-1'

      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800',

  ].join(' ');

}



export default function AppShell({

  title,

  subtitle,

  userName,

  role,

  online,

  onLogout,

  rightSlot,

  children,

}: AppShellProps) {

  const visibleNavItems = navItems.filter(

    (item) => !item.roles || (role ? item.roles.includes(role as 'propietario' | 'admin') : false),

  );



  return (

    <div className="min-h-screen">

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">

        <div className="border-b border-slate-100 bg-slate-50/80">

          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:px-6">

            <div className="flex min-w-0 items-center gap-2.5">

              <BrandMark className="h-10 w-10 shrink-0 border border-slate-200 bg-white shadow-sm md:h-11 md:w-11" zoom={1.35} />

              <p className="truncate text-sm font-black uppercase tracking-[0.06em] text-brand-800 md:text-base">

                Finca El Progreso

              </p>

            </div>



            <div className="flex flex-wrap items-center justify-end gap-1.5">

              <InstallAppButton />

              <SyncStatusBadge />

              {typeof online === 'boolean' ? (

                <span className={`gd-pill ${online ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>

                  {online ? 'En linea' : 'Sin internet'}

                </span>

              ) : null}

              {userName ? (

                <span className="gd-pill hidden bg-slate-200 text-slate-800 sm:inline-flex">

                  {userName}

                  {role ? ` (${role})` : ''}

                </span>

              ) : null}

              {onLogout ? (

                <button

                  type="button"

                  onClick={onLogout}

                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 md:text-sm"

                >

                  Salir

                </button>

              ) : null}

            </div>

          </div>

        </div>



        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

            <div>

              <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">{title}</h1>

              {subtitle ? <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p> : null}

            </div>

            {rightSlot ? <div className="flex flex-wrap items-center gap-2">{rightSlot}</div> : null}

          </div>

        </div>



        <nav className="hidden border-t border-slate-100 bg-white md:block">

          <div className="gd-nav-scroll mx-auto max-w-7xl overflow-x-auto px-4 pb-2 pt-2 md:px-6">

            <div className="flex min-w-max gap-1.5">

              {visibleNavItems.map((item) => (

                <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>

                  <item.Icon className="h-4 w-4 shrink-0" aria-hidden />

                  {item.label}

                </NavLink>

              ))}

            </div>

          </div>

        </nav>

      </header>



      <main className="mx-auto max-w-7xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-8">

        {children}

      </main>



      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/98 backdrop-blur md:hidden">

        <div className="gd-nav-scroll flex gap-1 overflow-x-auto px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2">

          {visibleNavItems.map((item) => (

            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive, true)}>

              <item.Icon className="mb-0.5 h-4 w-4" aria-hidden />

              <span className="leading-none">{item.label}</span>

            </NavLink>

          ))}

        </div>

      </nav>

    </div>

  );

}


