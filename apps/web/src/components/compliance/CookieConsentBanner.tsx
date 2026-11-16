import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconShield, IconCheck } from '../ui/Icons.js';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cloudvault_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cloudvault_cookie_consent', JSON.stringify({
      essential: true,
      analytics: false, // Invariant: Zero analytics tracking in zero-knowledge architecture
      functional: true,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('cloudvault_cookie_consent', JSON.stringify({
      essential: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and storage preferences"
      className="fixed bottom-0 inset-x-0 z-50 p-4 bg-slate-900 border-t border-slate-800 text-slate-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-slate-800 text-sky-400 shrink-0 mt-0.5">
            <IconShield size={18} />
          </div>
          <div className="text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-slate-100 mb-0.5">Privacy Notice and Essential Local Storage</p>
            <p>
              CloudVault uses essential browser storage (volatile memory and cryptographic session keys) to enable zero-knowledge encryption in your browser. We do not use third-party tracking or advertising cookies. Review our{' '}
              <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link> and{' '}
              <Link to="/terms" className="text-sky-400 hover:underline">Terms of Service</Link>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={handleEssentialOnly}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-md transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors flex items-center gap-1.5"
          >
            <IconCheck size={14} />
            <span>Accept Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

