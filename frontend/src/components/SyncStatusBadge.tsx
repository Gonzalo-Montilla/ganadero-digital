import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { countOutboxOperations } from '../offline/db';
import { syncOfflineOperations } from '../offline/sync';

export default function SyncStatusBadge() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refreshPending = useCallback(async () => {
    try {
      const total = await countOutboxOperations();
      setPending(total);
    } catch {
      setPending(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const safeRefresh = async () => {
      if (!mounted) return;
      await refreshPending();
    };

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    void safeRefresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('gd-outbox-changed', safeRefresh);
    document.addEventListener('visibilitychange', safeRefresh);

    const timer = window.setInterval(safeRefresh, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('gd-outbox-changed', safeRefresh);
      document.removeEventListener('visibilitychange', safeRefresh);
    };
  }, [refreshPending]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), 6000);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setHint(null);
    try {
      const result = await syncOfflineOperations();
      await refreshPending();
      if (result.message) {
        setHint(result.message);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!online) {
    return (
      <span className="gd-pill bg-amber-100 text-amber-800" title="Sin internet. Los cambios se guardan localmente.">
        <WifiOff className="mr-1 h-3 w-3" aria-hidden />
        Offline
      </span>
    );
  }

  if (pending > 0) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing}
          title="Toca para enviar los cambios pendientes al servidor"
          className="gd-pill inline-flex cursor-pointer items-center border border-sky-300 bg-sky-100 text-sky-800 transition hover:bg-sky-200 hover:shadow-sm disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCcw className={`mr-1 h-3 w-3 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
          {syncing ? 'Sincronizando…' : `Sincronizar (${pending})`}
        </button>
        {hint ? (
          <p className="absolute right-0 top-full z-30 mt-1 max-w-[16rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-md">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="gd-pill bg-emerald-100 text-emerald-800" title={hint || 'Todos los cambios están en el servidor'}>
        <Wifi className="mr-1 h-3 w-3" aria-hidden />
        Sincronizado
      </span>
      {hint ? (
        <p className="absolute right-0 top-full z-30 mt-1 max-w-[16rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-md">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
