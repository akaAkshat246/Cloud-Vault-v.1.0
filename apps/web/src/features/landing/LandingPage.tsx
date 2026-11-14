import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Cloud,
  Sparkles,
  LayoutDashboard,
  Key,
  Cpu,
  Zap,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  Terminal,
  ChevronDown,
  ChevronUp,
  HardDrive,
  EyeOff,
  AlertTriangle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';
import { useAuth } from '../../hooks/useAuth.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, masterKeyHex, logout } = useAuth();
  const isUnlocked = isAuthenticated && !!masterKeyHex;

  // FAQ interactive open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What is "Zero-Knowledge" encryption and how does it protect me?',
      a: 'Zero-knowledge encryption means that your master password, your Key Encryption Key (KEK), and your File Encryption Keys (FEK) are generated and derived exclusively inside your device’s memory (RAM). Neither your plain passwords nor the raw cryptographic keys are ever transmitted over the network or stored on CloudVault servers. We only store encrypted ciphertext blobs. Even if our servers are fully compromised or subjected to a subpoena, nobody can read your files without your master password or 24-word recovery phrase.',
    },
    {
      q: 'What happens if I forget my master password?',
      a: 'Because CloudVault is mathematically zero-knowledge, our support team cannot reset your password or recover your data for you. However, during registration, CloudVault generates an emergency 24-word BIP-39 mnemonic recovery phrase. This offline phrase can mathematically unwrap your master key, allowing you to regain full access to all your files and set a new password.',
    },
    {
      q: 'How does CloudVault handle large file uploads without lagging my browser?',
      a: 'CloudVault divides files into discrete 5 MiB (5,242,880-byte) chunks. Each chunk is encrypted in an isolated Web Worker using XChaCha20-Poly1305 authenticated encryption with unique nonces and authenticated additional data (AAD). Chunks are streamed directly to S3 cloud storage using pre-signed multipart URLs, ensuring low RAM footprint and high-speed upload resilience.',
    },
    {
      q: 'Do I have to re-encrypt all my files when I change my master password?',
      a: 'No! CloudVault employs an envelope encryption model. Each file is encrypted with its own unique File Encryption Key (FEK), which is wrapped by your Master Key. When you change your password, only your 32-byte Master Key envelope is re-wrapped with your new Key Encryption Key (KEK). Your gigabytes or terabytes of file data remain intact without requiring re-uploading or re-encryption.',
    },
    {
      q: 'Are file names, folder names, and metadata also encrypted?',
      a: 'Yes. CloudVault encrypts all metadata—including file names, folder names, MIME types, and folder hierarchies—using client-side AES-256-GCM / XChaCha20 before uploading. The storage server and cloud providers see only randomized UUIDs and encrypted ciphertext strings.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#EDE7F6] text-[#2E1A47] font-sans selection:bg-[#B388FF]/30 selection:text-[#5E35B1] relative overflow-x-hidden">
      {/* ======================================================== */}
      {/* Background Celestial Aesthetics                          */}
      {/* ======================================================== */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/40 blur-3xl pointer-events-none animate-float-slow" />
      <div className="fixed -top-20 -right-20 w-[30rem] h-[30rem] rounded-full bg-purple-200/40 blur-3xl pointer-events-none animate-float" />
      <div className="fixed top-1/3 -left-32 w-80 h-80 rounded-full bg-white/50 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.85)_0%,_rgba(237,231,246,0.45)_65%,_rgba(209,196,233,0.5)_100%)] pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* Top Floating Navigation Header                           */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-white/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="transform group-hover:scale-105 transition-transform duration-300">
              <BrandSquircle size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-[#2E1A47] tracking-tight group-hover:text-[#673AB7] transition-colors">
                  CloudVault
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#9575CD]/15 border border-[#9575CD]/30 text-[10px] font-bold text-[#5E35B1]">
                  v1.0 Zero-Knowledge Core
                </span>
              </div>
              <span className="text-[10px] text-[#7E699B] block font-medium">End-to-End Encrypted Storage</span>
            </div>
          </Link>

          {/* Quick Anchor Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#5E35B1]">
            <a href="#architecture" className="hover:text-[#673AB7] transition-colors">Architecture</a>
            <a href="#security" className="hover:text-[#673AB7] transition-colors">Security Protocol</a>
            <a href="#comparison" className="hover:text-[#673AB7] transition-colors">Comparison</a>
            <a href="#plans" className="hover:text-[#673AB7] transition-colors">Plans</a>
            <a href="#faq" className="hover:text-[#673AB7] transition-colors">FAQ</a>
          </nav>

          {/* Session Aware Auth CTAs */}
          <div className="flex items-center gap-3">
            {isUnlocked ? (
              <>
                <Link
                  to="/vault"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B388FF] to-[#7E57C2] text-white text-xs font-bold shadow-md shadow-purple-400/30 hover:shadow-lg hover:shadow-purple-400/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
                >
                  <LayoutDashboard size={14} />
                  <span>Open Vault</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E35B1] hover:bg-white/80 transition-all duration-200"
                >
                  Lock
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5E35B1] hover:bg-white/80 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B388FF] to-[#7E57C2] text-white text-xs font-bold shadow-md shadow-purple-400/30 hover:shadow-lg hover:shadow-purple-400/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative z-10 pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#D1C4E9] shadow-xs text-xs font-semibold text-[#5E35B1] mb-6 animate-fade-in-up">
          <Sparkles size={14} className="text-[#7E57C2]" />
          <span>True Zero-Knowledge Architecture • No Plaintext Storage</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2E1A47] tracking-tight max-w-4xl leading-[1.12]">
          Your files, always <span className="bg-gradient-to-r from-[#7E57C2] via-[#9575CD] to-[#B388FF] bg-clip-text text-transparent">safe, private</span> and mathematically protected.
        </h1>

        <p className="mt-5 text-sm sm:text-base text-[#6A5A87] max-w-2xl leading-relaxed">
          CloudVault encrypts your files client-side using military-grade XChaCha20-Poly1305 and Argon2id before they leave your device. We can never view, index, monetize, or leak your private data.
        </p>

        {/* Centerpiece 3D Saturn with Orbital Ring & Astronaut */}
        <Link
          to={isUnlocked ? '/vault' : '/login'}
          className="relative w-80 sm:w-96 h-56 flex items-center justify-center my-6 select-none group cursor-pointer"
        >
          {/* Glowing Planetary Orbit Ring */}
          <div className="absolute w-72 sm:w-84 h-24 border-2 border-white rounded-[100%] shadow-[0_0_25px_rgba(255,255,255,0.9)] transform -rotate-[16deg] pointer-events-none group-hover:scale-105 transition-transform duration-500 animate-pulse-glow" />

          {/* Lavender Striped Saturn Planet Body */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-[#E1BEE7] via-[#CE93D8] to-[#9575CD] shadow-[inset_-8px_-8px_16px_rgba(46,26,71,0.35),0_15px_35px_rgba(149,117,205,0.35)] flex items-center justify-center group-hover:scale-105 transition-transform duration-500 animate-float">
            <div className="absolute -bottom-3 w-40 h-10 bg-white/60 rounded-[100%] blur-sm animate-pulse-glow" />
          </div>

          {/* Floating Spacewalker Astronaut on the orbital ring */}
          <div className="absolute top-8 right-12 sm:right-14 transform rotate-12 group-hover:scale-125 transition-transform duration-300 animate-float-slow">
            <div className="w-11 h-11 rounded-2xl bg-white/95 border border-purple-200 shadow-lg flex items-center justify-center text-[#7E57C2]">
              <span className="text-2xl">🧑‍🚀</span>
            </div>
          </div>
        </Link>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isUnlocked ? (
            <Link
              to="/vault"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-sm shadow-[0_8px_25px_rgba(149,117,205,0.45)] hover:shadow-[0_12px_30px_rgba(149,117,205,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={16} />
              <span>Enter Vault Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-sm shadow-[0_8px_25px_rgba(149,117,205,0.45)] hover:shadow-[0_12px_30px_rgba(149,117,205,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Create Your Vault (5 GB Free)</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-[#2E1A47] hover:text-[#5E35B1] font-bold text-sm border border-[#D1C4E9] hover:border-[#B39DDB] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
              >
                Unlock Existing Vault
              </Link>
            </>
          )}
        </div>

        {/* Demo Quick Login Helper Banner */}
        <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 border border-[#D1C4E9] text-xs text-[#5E35B1]">
          <Zap size={14} className="text-[#9575CD]" />
          <span>Quick Demo Access: <strong>akshat@cloudvault.internal</strong> • Password: <strong>CloudVault@2026!</strong></span>
          <Link to="/login" className="underline font-bold text-[#673AB7] hover:text-[#2E1A47] ml-1">Log In &rarr;</Link>
        </div>

        {/* 4 Cryptographic Guarantee Pills */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl w-full">
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/80 border border-[#D1C4E9] text-xs font-bold text-[#5E35B1] shadow-xs">
            <ShieldCheck size={16} className="text-[#7E57C2] shrink-0" />
            <span>XChaCha20-Poly1305</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/80 border border-[#D1C4E9] text-xs font-bold text-[#5E35B1] shadow-xs">
            <Lock size={16} className="text-[#7E57C2] shrink-0" />
            <span>Argon2id (64MB, t=3)</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/80 border border-[#D1C4E9] text-xs font-bold text-[#5E35B1] shadow-xs">
            <Cloud size={16} className="text-[#7E57C2] shrink-0" />
            <span>Direct S3 Multipart</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/80 border border-[#D1C4E9] text-xs font-bold text-[#5E35B1] shadow-xs">
            <Key size={16} className="text-[#7E57C2] shrink-0" />
            <span>BIP-39 24-Word Kit</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ARCHITECTURE: HOW ZERO-KNOWLEDGE WORKS                 */}
      {/* ======================================================== */}
      <section id="architecture" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-[#7E57C2] uppercase tracking-wider block mb-2">
            The Cryptographic Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2E1A47] tracking-tight">
            How Zero-Knowledge Encryption Works Under the Hood
          </h2>
          <p className="mt-3 text-sm text-[#6A5A87] leading-relaxed">
            Your master password is never sent across the internet. Every encryption step happens locally inside your browser via WebAssembly Libsodium and Web Crypto Subtle APIs.
          </p>
        </div>

        {/* 5-Step Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#D1C4E9] shadow-[0_10px_30px_rgba(149,117,205,0.12)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-sm mb-3">
                01
              </div>
              <h3 className="text-base font-bold text-[#2E1A47] mb-2">Memory-Hard KDF</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Argon2id derives a 64-byte PRK using 64 MiB RAM and 3 iterations inside an isolated Web Worker. Resists GPU/ASIC brute force.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE7F6] flex items-center gap-1.5 text-[10px] font-mono text-[#7E57C2]">
              <Cpu size={12} />
              <span>Client WebAssembly</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#D1C4E9] shadow-[0_10px_30px_rgba(149,117,205,0.12)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-sm mb-3">
                02
              </div>
              <h3 className="text-base font-bold text-[#2E1A47] mb-2">Domain Separation</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                HKDF-SHA256 expands the PRK into two isolated keys: <strong>AuthKey</strong> (sent to verify password) and <strong>KEK</strong> (never leaves RAM).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE7F6] flex items-center gap-1.5 text-[10px] font-mono text-[#7E57C2]">
              <Layers size={12} />
              <span>HKDF RFC 5869</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#D1C4E9] shadow-[0_10px_30px_rgba(149,117,205,0.12)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-sm mb-3">
                03
              </div>
              <h3 className="text-base font-bold text-[#2E1A47] mb-2">Envelope Wrapping</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                The MasterKey is wrapped with AES-256-GCM using domain tag <code className="bg-purple-50 px-1 py-0.5 rounded text-[10px]">cloudvault-master-key-wrap-v1</code>. Server only holds ciphertext.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE7F6] flex items-center gap-1.5 text-[10px] font-mono text-[#7E57C2]">
              <Lock size={12} />
              <span>AES-256-GCM Envelope</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#D1C4E9] shadow-[0_10px_30px_rgba(149,117,205,0.12)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-sm mb-3">
                04
              </div>
              <h3 className="text-base font-bold text-[#2E1A47] mb-2">5 MiB Chunk Framing</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Files are partitioned into 5 MiB slices. Each slice is encrypted with a distinct FEK, 12-byte IV, and 16-byte Poly1305 MAC tag before streaming.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE7F6] flex items-center gap-1.5 text-[10px] font-mono text-[#7E57C2]">
              <ShieldCheck size={12} />
              <span>XChaCha20-Poly1305</span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#D1C4E9] shadow-[0_10px_30px_rgba(149,117,205,0.12)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold text-sm mb-3">
                05
              </div>
              <h3 className="text-base font-bold text-[#2E1A47] mb-2">Direct S3 Streaming</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Encrypted chunks are uploaded straight to S3/MinIO via signed PUT endpoints. The backend never buffers file contents.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE7F6] flex items-center gap-1.5 text-[10px] font-mono text-[#7E57C2]">
              <Cloud size={12} />
              <span>Zero Backend Transit</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SIX PILLARS OF SECURITY                               */}
      {/* ======================================================== */}
      <section id="security" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-[#7E57C2] uppercase tracking-wider block mb-2">
            Engineered For Absolute Privacy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2E1A47] tracking-tight">
            Six Built-In Pillars of the CloudVault Protocol
          </h2>
          <p className="mt-3 text-sm text-[#6A5A87] leading-relaxed">
            Every feature in CloudVault is designed according to strict mathematical verification standards validated against formal test vectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">Zero-Knowledge Invariant</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Neither your master password, KEK, nor MasterKey are ever persisted in localStorage, sessionStorage, or IndexedDB. When you close the browser tab, in-memory keys are instantly wiped from RAM.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>Guaranteed volatile RAM lifecycle</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">24-Word BIP-39 Emergency Kit</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                During registration, you receive 256 bits of cryptographic entropy mapped to 24 standard English BIP-39 dictionary words with a SHA-256 checksum. If you lose your password, this phrase restores access without server assistance.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>Offline paper backup standard</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">Instant Password Changes</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Changing your master password only requires deriving a new KEK and re-encrypting the 32-byte MasterKey envelope. You never have to download, re-encrypt, or re-upload gigabytes of stored files.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>Zero file re-encryption latency</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <EyeOff size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">Anti-User Enumeration</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Our pre-login endpoint returns deterministic cryptographic salts for unknown email addresses using a server-side HMAC balancing routine. Attackers cannot discover whether an email has a registered account.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>Constant-time timing attack protection</span>
            </div>
          </div>

          {/* Pillar 5 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">Encrypted Metadata & Paths</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                File names, folder hierarchies, sizes, and MIME types are encrypted with AES-256-GCM before database synchronization. Anyone inspecting database tables sees only random base64 ciphertext and UUIDs.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>Total file list obfuscation</span>
            </div>
          </div>

          {/* Pillar 6 */}
          <div className="p-7 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between group hover:shadow-[0_20px_45px_rgba(149,117,205,0.22)] transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <HardDrive size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2E1A47] mb-2">Multi-Cloud Storage Engine</h3>
              <p className="text-xs text-[#6A5A87] leading-relaxed">
                Built on top of the S3-compatible API standard (MinIO, AWS S3, Cloudflare R2, Wasabi). Your encrypted chunks can be hosted on any object storage provider without lock-in or plain data exposure.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#5E35B1]">
              <Check size={14} className="text-emerald-500" />
              <span>S3 standard interoperability</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. COMPARISON MATRIX (CloudVault vs Big Tech Cloud)     */}
      {/* ======================================================== */}
      <section id="comparison" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-[#7E57C2] uppercase tracking-wider block mb-2">
            Why Privacy Matters
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2E1A47] tracking-tight">
            How CloudVault Compares to Traditional Cloud Storage
          </h2>
          <p className="mt-3 text-sm text-[#6A5A87] leading-relaxed">
            Most commercial cloud providers retain the encryption keys to your data, allowing them to scan, index, analyze, or hand over your files upon government demand.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="rounded-3xl bg-white/90 border border-white shadow-[0_20px_50px_rgba(149,117,205,0.18)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#161226] text-white border-b border-[#352C55]">
                  <th className="p-4 sm:p-5 font-bold">Capability / Guarantee</th>
                  <th className="p-4 sm:p-5 font-bold text-[#C084FC] bg-[#221C38]">
                    <div className="flex items-center gap-2">
                      <BrandSquircle size={24} />
                      <span>CloudVault</span>
                    </div>
                  </th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-300">Google Drive</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-300">Dropbox</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-300">iCloud Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70">
                <tr className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#2E1A47]">
                    End-to-End Client-Side Encryption
                    <span className="block text-[11px] font-normal text-[#7E699B]">Encrypted on device prior to upload</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-purple-50/60">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>100% Client-Side</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Server-side only</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Server-side only</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-amber-600">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span>Opt-in (ADP only)</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#2E1A47]">
                    Can Provider Read or Scan Files?
                    <span className="block text-[11px] font-normal text-[#7E699B]">Scanned for AI training, ads, or content indexing</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-purple-50/60">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Impossible (Zero Knowledge)</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Yes (Scanned & indexed)</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Yes (Full access)</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Yes (Standard tier)</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#2E1A47]">
                    Key Derivation Function (KDF)
                    <span className="block text-[11px] font-normal text-[#7E699B]">Protection against offline password crack dictionaries</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#5E35B1] bg-purple-50/60">
                    <span>Argon2id (64 MiB, t=3)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-[#6A5A87]">PBKDF2 / SHA-256</td>
                  <td className="p-4 sm:p-5 text-[#6A5A87]">Bcrypt / SHA-256</td>
                  <td className="p-4 sm:p-5 text-[#6A5A87]">Symmetric device keys</td>
                </tr>

                <tr className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#2E1A47]">
                    24-Word Paper Emergency Recovery Kit
                    <span className="block text-[11px] font-normal text-[#7E699B]">BIP-39 mnemonic recovery phrase</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-purple-50/60">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Standard 24-word BIP-39</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Not supported</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Not supported</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-amber-600">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span>28-character alphanumeric key</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-[#2E1A47]">
                    Metadata & File Name Encryption
                    <span className="block text-[11px] font-normal text-[#7E699B]">File names hidden from storage admins</span>
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-purple-50/60">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>Fully Encrypted</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Plaintext metadata</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-red-500">
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-red-400 shrink-0" />
                      <span>Plaintext metadata</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-amber-600">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span>Partial plaintext metadata</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. TRANSPARENT CRYPTOGRAPHIC SPECIFICATIONS               */}
      {/* ======================================================== */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#0E0A1A] text-white border border-[#271E42] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8F2BF7]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10 border-b border-[#251B3D] pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#C084FC]">
                <Terminal size={18} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Audit & Transparency</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Cryptographic Specification Standards
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#9D94B8] max-w-xl leading-relaxed">
                CloudVault does not invent custom cryptography. We use peer-reviewed, RFC-standard primitives validated against automated test vector suites.
              </p>
            </div>

            <a
              href="https://github.com/akaAkshat246/Cloud-Vault-v.1.0"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#1C1433] hover:bg-[#2A1E4A] border border-[#3D2C68] hover:border-[#8F6BFF] text-xs font-semibold text-white transition-all flex items-center gap-2 shrink-0"
            >
              <span>View GitHub Repository</span>
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#140D26] border border-[#251B3D]">
              <span className="text-[10px] text-[#A396C2] uppercase tracking-wider block mb-1">Key Derivation</span>
              <strong className="text-white text-sm block mb-1">Argon2id (RFC 9106)</strong>
              <span className="text-[#8C82A8] text-[11px] block">m=65536 KiB (64 MiB), t=3 iterations, p=1 parallelism</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#140D26] border border-[#251B3D]">
              <span className="text-[10px] text-[#A396C2] uppercase tracking-wider block mb-1">Authenticated Payload</span>
              <strong className="text-white text-sm block mb-1">XChaCha20-Poly1305</strong>
              <span className="text-[#8C82A8] text-[11px] block">256-bit key, 192-bit extended nonce, 128-bit Poly1305 MAC</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#140D26] border border-[#251B3D]">
              <span className="text-[10px] text-[#A396C2] uppercase tracking-wider block mb-1">Key Expansion</span>
              <strong className="text-white text-sm block mb-1">HKDF-SHA256 (RFC 5869)</strong>
              <span className="text-[#8C82A8] text-[11px] block">Domain separation for AuthKey and KEK generation</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#140D26] border border-[#251B3D]">
              <span className="text-[10px] text-[#A396C2] uppercase tracking-wider block mb-1">Emergency Paper Kit</span>
              <strong className="text-white text-sm block mb-1">BIP-39 Mnemonic</strong>
              <span className="text-[#8C82A8] text-[11px] block">256-bit entropy, 24 words, PBKDF2-HMAC-SHA512 derivation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. STORAGE PLANS & PRICING                                */}
      {/* ======================================================== */}
      <section id="plans" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-[#7E57C2] uppercase tracking-wider block mb-2">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2E1A47] tracking-tight">
            Simple, Honest Storage for Individuals & Teams
          </h2>
          <p className="mt-3 text-sm text-[#6A5A87] leading-relaxed">
            Start completely free with 5 GB of zero-knowledge encrypted cloud vault storage. Upgrade anytime when you need more space.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan 1: Free */}
          <div className="p-8 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <span className="text-xs font-bold text-[#7E57C2] uppercase tracking-wider block mb-1">Free Tier</span>
              <h3 className="text-2xl font-extrabold text-[#2E1A47]">Starter Vault</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-[#2E1A47]">₹0</span>
                <span className="text-xs text-[#7E699B] ml-1">forever</span>
              </div>

              <ul className="space-y-3 text-xs text-[#5E35B1]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span><strong>5 GiB</strong> Encrypted Object Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Full Zero-Knowledge Client Suite</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>24-Word BIP-39 Emergency Recovery Kit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>5 MiB Chunk Streaming Uploads</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3 rounded-xl bg-white hover:bg-purple-50 text-[#5E35B1] font-bold text-xs border border-[#D1C4E9] text-center shadow-xs hover:shadow-md transition-all"
            >
              Create Free Account
            </Link>
          </div>

          {/* Plan 2: Personal (Highlighted) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#251A45] to-[#140D26] text-white border-2 border-[#9575CD] shadow-[0_20px_50px_rgba(126,87,194,0.35)] flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#B388FF] to-[#7E57C2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <span className="text-xs font-bold text-[#C084FC] uppercase tracking-wider block mb-1">Personal</span>
              <h3 className="text-2xl font-extrabold text-white">Power Vault</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-white">₹149</span>
                <span className="text-xs text-[#A396C2] ml-1">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-[#D8B4FE]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span><strong>100 GiB</strong> High-Speed Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Unlimited File Upload Sizes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Multi-Device Volatile Session Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Priority S3 Multipart Bandwidth</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-[#B388FF] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-xs shadow-md shadow-purple-500/40 text-center transition-all"
            >
              Upgrade to Personal
            </Link>
          </div>

          {/* Plan 3: Pro */}
          <div className="p-8 rounded-3xl bg-white/90 border border-white shadow-[0_15px_35px_rgba(149,117,205,0.15)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div>
              <span className="text-xs font-bold text-[#7E57C2] uppercase tracking-wider block mb-1">Pro / Teams</span>
              <h3 className="text-2xl font-extrabold text-[#2E1A47]">Enterprise Cosmos</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-[#2E1A47]">₹349</span>
                <span className="text-xs text-[#7E699B] ml-1">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-[#5E35B1]">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span><strong>1 TiB (1024 GB)</strong> Ultra-Secure Vault</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Immutable Cryptographic Audit Trails</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Team Workspaces & End-to-End Share Links</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Dedicated Cold Storage Backup Mirror</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              className="mt-8 w-full py-3 rounded-xl bg-white hover:bg-purple-50 text-[#5E35B1] font-bold text-xs border border-[#D1C4E9] text-center shadow-xs hover:shadow-md transition-all"
            >
              Get Pro Vault
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ)                      */}
      {/* ======================================================== */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold text-[#7E57C2] uppercase tracking-wider block mb-2">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-[#2E1A47] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#6A5A87]">
            Everything you need to know about CloudVault’s zero-knowledge security guarantees.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white/90 border border-white shadow-xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#2E1A47] hover:text-[#5E35B1] transition-colors"
                >
                  <span>{faq.q}</span>
                  <div className="w-7 h-7 rounded-full bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#6A5A87] leading-relaxed border-t border-purple-100/60 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. BOTTOM CALL TO ACTION BANNER                          */}
      {/* ======================================================== */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] p-8 sm:p-14 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to take back your digital privacy?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-purple-100 leading-relaxed">
              Create your zero-knowledge vault in less than 60 seconds. No credit card required. Free 5 GB included forever.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-[#5E35B1] hover:bg-purple-50 font-extrabold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
            >
              Start Free Vault
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#5E35B1]/30 hover:bg-[#5E35B1]/50 border border-white/30 text-white font-bold text-sm text-center transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. EXTENSIVE FOOTER                                      */}
      {/* ======================================================== */}
      <footer className="relative z-10 bg-[#161226] text-white border-t border-[#352C55] pt-14 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <BrandSquircle size={38} />
              <span className="font-extrabold text-lg tracking-tight">CloudVault</span>
            </div>
            <p className="text-xs text-[#A3A1BD] leading-relaxed mb-4">
              The next-generation zero-knowledge encrypted cloud storage platform. Engineered with precision for absolute mathematical privacy.
            </p>
            <div className="text-[11px] text-[#7A7094]">
              &copy; {new Date().getFullYear()} CloudVault Inc. All rights reserved.
            </div>
          </div>

          {/* Col 2: Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C084FC] mb-4">Architecture</h4>
            <ul className="space-y-2 text-xs text-[#A3A1BD]">
              <li><a href="#architecture" className="hover:text-white transition-colors">Client Argon2id Derivation</a></li>
              <li><a href="#architecture" className="hover:text-white transition-colors">XChaCha20-Poly1305 Chunking</a></li>
              <li><a href="#architecture" className="hover:text-white transition-colors">Envelope Encryption</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Anti-User Enumeration</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">24-Word BIP-39 Recovery</a></li>
            </ul>
          </div>

          {/* Col 3: Product & Plans */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C084FC] mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-[#A3A1BD]">
              <li><Link to="/register" className="hover:text-white transition-colors">Free Tier (5 GB)</Link></li>
              <li><a href="#plans" className="hover:text-white transition-colors">Personal Plan (100 GB)</a></li>
              <li><a href="#plans" className="hover:text-white transition-colors">Pro Plan (1 TB)</a></li>
              <li><Link to="/vault" className="hover:text-white transition-colors">Vault Web Explorer</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Unlock Session</Link></li>
            </ul>
          </div>

          {/* Col 4: Open Source & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C084FC] mb-4">Security & Code</h4>
            <ul className="space-y-2 text-xs text-[#A3A1BD]">
              <li>
                <a
                  href="https://github.com/akaAkshat246/Cloud-Vault-v.1.0"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li><a href="#security" className="hover:text-white transition-colors">Cryptographic Test Vectors</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Privacy FAQ</a></li>
              <li><Link to="/verify-email" className="hover:text-white transition-colors">Email Verification</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#251B3D] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7A7094] gap-3">
          <div>
            Engineered with libsodium WebAssembly, SubtleCrypto, PostgreSQL, and MinIO S3 object storage.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-300">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300">Zero-Knowledge Guarantee</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
