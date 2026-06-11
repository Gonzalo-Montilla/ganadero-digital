import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = window.localStorage.getItem('gd-ios-install-hint-dismissed') === '1';

    if (isIos && !isStandalone && !dismissed) {
      setShowIosHint(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismissIosHint = () => {
    setShowIosHint(false);
    window.localStorage.setItem('gd-ios-install-hint-dismissed', '1');
  };

  if (installed) return null;

  if (!deferredPrompt && showIosHint) {
    return (
      <button onClick={dismissIosHint} className="gd-btn-secondary !px-3 !py-2 text-xs" title="Instalación en iPhone">
        En iPhone: Compartir y anadir a inicio
      </button>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <button onClick={handleInstall} className="gd-btn-secondary !px-3 !py-2" title="Instalar app">
      <Download className="mr-1 h-4 w-4" />
      Instalar
    </button>
  );
}
