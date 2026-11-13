import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Lock, Cloud, Sparkles, LayoutDashboard } from 'lucide-react';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';
import { useAuth } from '../../hooks/useAuth.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, masterKeyHex, logout } = useAuth();
  const isUnlocked = isAuthenticated && !!masterKeyHex;

  return (
    <div className="min-h-screen bg-[#EDE7F6] flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-[#B388FF]/30 selection:text-[#5E35B1] animate-fade-in">
      {/* ======================================================== */}
      {/* Background Celestial Aesthetics mirroring Image 4        */}
      {/* ======================================================== */}

      {/* Floating Cloud Formations (Bottom Left & Right) with gentle floating animations */}
      <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-white/40 blur-2xl pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/50 blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-purple-100/60 blur-2xl pointer-events-none animate-pulse-glow" />

      {/* Ambient Celestial Nebula Swirl */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.85)_0%,_rgba(237,231,246,0.4)_65%,_rgba(209,196,233,0.5)_100%)] pointer-events-none" />

      {/* Top Floating Mini Header */}
      <header className="relative z-20 flex items-center justify-between max-w-6xl mx-auto w-full animate-fade-in-up">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="transform group-hover:scale-105 transition-transform duration-300">
            <BrandSquircle size={42} />
          </div>
          <span className="font-extrabold text-lg text-[#2E1A47] tracking-tight group-hover:text-[#673AB7] transition-colors">
            CloudVault
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isUnlocked ? (
            <>
              <Link
                to="/vault"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B388FF] to-[#7E57C2] text-white text-xs font-bold shadow-md shadow-purple-400/30 hover:shadow-lg hover:shadow-purple-400/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
              >
                <LayoutDashboard size={14} />
                <span>Open Dashboard</span>
              </Link>
              <button
                onClick={() => logout()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E35B1] hover:bg-white/80 hover:shadow-xs transition-all duration-200"
              >
                Lock Vault
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5E35B1] hover:bg-white/80 hover:shadow-xs transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B388FF] to-[#7E57C2] text-white text-xs font-bold shadow-md shadow-purple-400/30 hover:shadow-lg hover:shadow-purple-400/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero & Center Saturn Illustration */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto py-10 text-center animate-fade-in-up">
        {/* Logo Squircle with Name underneath mirroring Image 4 */}
        <div className="flex flex-col items-center mb-8">
          <Link to={isUnlocked ? '/vault' : '/login'} className="transform hover:scale-110 transition-transform duration-300 mb-3 inline-block cursor-pointer">
            <BrandSquircle size={72} className="shadow-[0_12px_28px_rgba(149,117,205,0.4)]" />
          </Link>
          <span className="font-extrabold text-xl sm:text-2xl text-[#2E1A47] tracking-tight">
            CloudVault
          </span>
        </div>

        {/* Centerpiece 3D Lavender Saturn with Glowing Orbital Ring & Floating Astronaut */}
        <Link
          to={isUnlocked ? '/vault' : '/login'}
          className="relative w-80 sm:w-96 h-56 flex items-center justify-center my-2 select-none group cursor-pointer"
        >
          {/* Glowing Planetary Orbit Ring with continuous gentle orbit shimmer */}
          <div className="absolute w-72 sm:w-80 h-24 border-2 border-white rounded-[100%] shadow-[0_0_25px_rgba(255,255,255,0.9)] transform -rotate-[16deg] pointer-events-none group-hover:scale-105 transition-transform duration-500 animate-pulse-glow" />

          {/* Lavender Striped Saturn Planet Body with Floating Animation */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-[#E1BEE7] via-[#CE93D8] to-[#9575CD] shadow-[inset_-8px_-8px_16px_rgba(46,26,71,0.35),0_15px_35px_rgba(149,117,205,0.35)] flex items-center justify-center group-hover:scale-105 transition-transform duration-500 animate-float">
            {/* Soft cloud bank surrounding planet base */}
            <div className="absolute -bottom-3 w-40 h-10 bg-white/60 rounded-[100%] blur-sm animate-pulse-glow" />
          </div>

          {/* Floating Spacewalker Astronaut on the orbital ring with slow floating motion */}
          <div className="absolute top-8 right-12 sm:right-14 transform rotate-12 group-hover:scale-125 transition-transform duration-300 animate-float-slow">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-purple-200 shadow-lg flex items-center justify-center text-[#7E57C2]">
              <span className="text-2xl">🧑‍🚀</span>
            </div>
          </div>
        </Link>

        {/* Tagline & Subheading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2E1A47] tracking-tight mt-6 max-w-xl leading-tight">
          Your personal zero-knowledge cosmos in the cloud.
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-[#7E699B] max-w-md mx-auto leading-relaxed">
          All files are encrypted client-side using XChaCha20-Poly1305 before leaving your device. We can never see your data.
        </p>

        {/* CTA Buttons with interactive lift */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
          {isUnlocked ? (
            <Link
              to="/vault"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-sm shadow-[0_8px_25px_rgba(149,117,205,0.45)] hover:shadow-[0_12px_30px_rgba(149,117,205,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>Go to Your Vault Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-sm shadow-[0_8px_25px_rgba(149,117,205,0.45)] hover:shadow-[0_12px_30px_rgba(149,117,205,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Create Your Vault</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/85 hover:bg-white text-[#2E1A47] hover:text-[#5E35B1] font-bold text-sm border border-[#D1C4E9] hover:border-[#B39DDB] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
              >
                Unlock Existing Vault
              </Link>
            </>
          )}
        </div>

        {/* 3 Pill Badges with hover interaction */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#D1C4E9] hover:border-[#B39DDB] text-[11px] font-semibold text-[#5E35B1] shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <ShieldCheck size={14} className="text-[#7E57C2]" />
            <span>XChaCha20-Poly1305</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#D1C4E9] hover:border-[#B39DDB] text-[11px] font-semibold text-[#5E35B1] shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <Lock size={14} className="text-[#7E57C2]" />
            <span>Argon2id (t=3, m=64MB)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#D1C4E9] hover:border-[#B39DDB] text-[11px] font-semibold text-[#5E35B1] shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <Cloud size={14} className="text-[#7E57C2]" />
            <span>Direct S3 Multipart</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-[#A594BD] py-2">
        CloudVault • Zero-Knowledge Storage Architecture • Powered by libsodium & WebCrypto
      </footer>
    </div>
  );
};
