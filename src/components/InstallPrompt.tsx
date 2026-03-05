import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] bg-stone-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500 rounded-xl flex-shrink-0">
          <Download size={20} />
        </div>
        <div>
          <h3 className="font-bold text-sm">Instal·lar Eco-Reboot</h3>
          <p className="text-xs text-stone-400">Afegeix l'app a la pantalla d'inici</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowPrompt(false)}
          className="p-2 text-stone-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <button 
          onClick={handleInstallClick}
          className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors whitespace-nowrap"
        >
          Instal·lar
        </button>
      </div>
    </div>
  );
}
