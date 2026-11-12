import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes.js';
import { usePWA } from '../hooks/usePWA.js';
import { WifiOff, Download } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export const App: React.FC = () => {
  const { isInstallable, isOnline, promptInstall } = usePWA();

  return (
    <BrowserRouter>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff size={14} />
          <span>You are currently offline. Local application shell is active.</span>
        </div>
      )}

      {/* PWA Install Banner (Mobile / Desktop) */}
      {isInstallable && (
        <div className="bg-teal-950 border-b border-teal-500/30 text-teal-200 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Download size={14} className="text-teal-400" />
            <span>Install CloudVault PWA for fast, standalone access.</span>
          </div>
          <Button variant="primary" size="sm" onClick={promptInstall}>
            Install
          </Button>
        </div>
      )}

      <AppRoutes />
    </BrowserRouter>
  );
};
