import { Link, Outlet } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import InstallPrompt from './InstallPrompt';

export default function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 flex flex-col">
      
      <InstallPrompt />

      {/* Simple Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-emerald-800 hover:opacity-80 transition-opacity">
            <Recycle className="w-5 h-5" />
            <span>Eco-Reboot</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-14">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="bg-stone-100 text-stone-400 py-6 px-4 mt-auto text-center text-xs">
        <p>© 2026 Eco-Reboot. Passaport Digital de Productes.</p>
      </footer>
    </div>
  );
}
