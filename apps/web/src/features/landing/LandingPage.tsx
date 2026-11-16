import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconLock,
  IconKey,
  IconShieldCheck,
  IconFileText,
  IconFolder,
  IconChevronDown,
  IconChevronUp,
  IconHardDrive,
  IconSearch,
  IconArrowRight,
  IconCpu,
} from '../../components/ui/Icons.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Skeleton } from '../../components/ui/Skeleton.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, masterKeyHex } = useAuth();
  const isUnlocked = isAuthenticated && !!masterKeyHex;

  // Real product demo interactive tab state
  const [activeDemoTab, setActiveDemoTab] = useState<'pipeline' | 'vault' | 'keys'>('pipeline');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // FAQ interactive state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleTabChange = (tab: 'pipeline' | 'vault' | 'keys') => {
    setIsDemoLoading(true);
    setActiveDemoTab(tab);
    setTimeout(() => {
      setIsDemoLoading(false);
    }, 280);
  };

  const faqs = [
    {
      q: 'What is zero-knowledge encryption and how does it protect my files?',
      a: 'Zero-knowledge encryption ensures that your master password, Key Encryption Key (KEK), and File Encryption Keys (FEK) are derived and computed exclusively in your browser RAM. Raw cryptographic keys never traverse the network and are never stored on CloudVault servers. Storage providers only receive AES-256-GCM and XChaCha20-Poly1305 ciphertext blobs.',
    },
    {
      q: 'What happens if I forget my master password?',
      a: 'Because CloudVault operates on a zero-knowledge mathematical model, our engineering team cannot recover your password or access your files. During account creation, you receive an emergency 24-word BIP-39 mnemonic recovery phrase. This offline phrase can derive and unwrap your master key, allowing you to regain vault access.',
    },
    {
      q: 'How does CloudVault handle multi-gigabyte uploads without browser latency?',
      a: 'CloudVault partitions large files into deterministic 5 MiB chunks. Each chunk is processed in dedicated background Web Workers using streaming XChaCha20-Poly1305 encryption with authenticated additional data (AAD). Chunks upload concurrently via pre-signed multipart endpoints to minimize memory usage.',
    },
    {
      q: 'Do I have to re-encrypt all my data if I update my master password?',
      a: 'No. CloudVault utilizes cryptographic envelope encryption. Each stored file is encrypted with an isolated 256-bit File Encryption Key (FEK), which is wrapped by your Master Key. Changing your password only requires re-wrapping your 32-byte Master Key envelope with your new KEK. Your file payloads remain unchanged in object storage.',
    },
    {
      q: 'Are file names, folder names, and directory paths encrypted?',
      a: 'Yes. CloudVault encrypts all metadata, including file names, MIME types, parent directories, and hierarchical paths, using authenticated client-side ciphers before transmission. Cloud storage providers only see randomized UUIDs and opaque encrypted payloads.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-sky-600/30 selection:text-sky-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0B0F19] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <BrandSquircle size={34} />
            <div>
              <span className="font-bold text-base text-slate-100 tracking-tight">CloudVault</span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-[10px] font-mono text-sky-400">
                v1.0 Zero-Knowledge Core
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#demo" className="hover:text-sky-400 transition-colors">Product Walkthrough</a>
            <a href="#architecture" className="hover:text-sky-400 transition-colors">Security Architecture</a>
            <a href="#comparison" className="hover:text-sky-400 transition-colors">Platform Comparison</a>
            <a href="#pricing" className="hover:text-sky-400 transition-colors">Storage Allocation</a>
            <a href="#faq" className="hover:text-sky-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isUnlocked ? (
              <Link
                to="/vault"
                className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Open Vault</span>
                <IconArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Create Vault</span>
                  <IconArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900 text-slate-300 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Client-Side End-to-End Encryption Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Zero-knowledge encrypted cloud storage.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
            Protect your sensitive documents, keys, and intellectual property. CloudVault enforces client-side Argon2id key derivation, AES-256-GCM metadata obfuscation, and authenticated XChaCha20 chunk streaming before any byte reaches the server.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold text-center transition-colors flex items-center justify-center gap-2"
            >
              <span>Initialize Encrypted Vault</span>
              <IconArrowRight size={16} />
            </Link>
            <a
              href="#demo"
              className="px-5 py-2.5 rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold text-center transition-colors"
            >
              Inspect Architecture Demo
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              <span className="font-mono text-slate-200 block text-sm font-semibold">Argon2id</span>
              <span>Memory-hard key derivation</span>
            </div>
            <div>
              <span className="font-mono text-slate-200 block text-sm font-semibold">256-Bit</span>
              <span>Authenticated AES & XChaCha20</span>
            </div>
            <div>
              <span className="font-mono text-slate-200 block text-sm font-semibold">BIP-39</span>
              <span>24-word offline recovery kit</span>
            </div>
            <div>
              <span className="font-mono text-slate-200 block text-sm font-semibold">GDPR Art. 17</span>
              <span>Cryptographic data shredding</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real Product Demo & Interactive Walkthrough Section */}
      <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            Real Product Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Interactive Product Walkthrough</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore the live interface components and mathematical pipeline that execute entirely inside your local browser sandbox.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => handleTabChange('pipeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeDemoTab === 'pipeline'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <IconCpu size={14} />
            <span>1. Client Encryption Pipeline</span>
          </button>

          <button
            onClick={() => handleTabChange('vault')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeDemoTab === 'vault'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <IconFolder size={14} />
            <span>2. Zero-Knowledge File Manager</span>
          </button>

          <button
            onClick={() => handleTabChange('keys')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeDemoTab === 'keys'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <IconKey size={14} />
            <span>3. Key Envelope & Recovery Inspector</span>
          </button>
        </div>

        {/* Interactive Demo Display Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 min-h-[380px]">
          {isDemoLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : activeDemoTab === 'pipeline' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Step-by-Step Client Encryption Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-0.5">How a file is secured before leaving your device</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-300">
                  Worker Thread Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <span className="text-xs font-bold text-slate-200">Local Argon2id Derivation</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Master password + deterministic user salt derived with 64 MiB memory cost. Produces 32-byte AuthKey for session auth and 32-byte Key Encryption Key (KEK).
                  </p>
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    authKey = Argon2id(pass, salt, m=65536, t=3, p=1)
                  </div>
                </div>

                <div className="p-4 rounded-md bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                    <span className="text-xs font-bold text-slate-200">File Envelope Key (FEK)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Browser generates a cryptographically secure random 256-bit FEK for each upload. The FEK is encrypted with your Master Key using AES-256-GCM.
                  </p>
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    wrapped_fek = AES_256_GCM_Encrypt(MasterKey, FEK)
                  </div>
                </div>

                <div className="p-4 rounded-md bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
                    <span className="text-xs font-bold text-slate-200">5 MiB Chunk Stream Encryption</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Input stream is sliced into 5 MiB blocks. Dedicated Web Worker encrypts each block using XChaCha20-Poly1305 with authenticated chunk indexes.
                  </p>
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    chunk_ct = XChaCha20_Poly1305(FEK, nonce_i, chunk_bytes)
                  </div>
                </div>

                <div className="p-4 rounded-md bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">4</span>
                    <span className="text-xs font-bold text-slate-200">Direct S3 / MinIO Multipart Upload</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Encrypted chunks stream directly to cloud object storage via short-lived pre-signed URLs. Backend verifies HMAC signatures without viewing plain data.
                  </p>
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    HTTP PUT pre_signed_url &rarr; S3 Bucket (Ciphertext Only)
                  </div>
                </div>
              </div>
            </div>
          ) : activeDemoTab === 'vault' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Vault Root: /Documents/Confidential</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">AES-GCM Filename Obfuscation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                    <IconSearch size={13} />
                    <span>Search decrypted tree...</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-900 text-sky-400">
                      <IconFolder size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Audit_Reports_2026</span>
                      <span className="text-[11px] text-slate-500">Encrypted Folder (4 child objects)</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Folder</span>
                </div>

                <div className="p-3 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-900 text-sky-400">
                      <IconFileText size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">q3_financial_model.enc</span>
                      <span className="text-[11px] text-slate-500">14.2 MB &bull; 3 chunks &bull; XChaCha20-Poly1305</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-300">
                    FEK Wrapped
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-900 text-sky-400">
                      <IconFileText size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">patents_draft_rev4.pdf</span>
                      <span className="text-[11px] text-slate-500">3.8 MB &bull; 1 chunk &bull; XChaCha20-Poly1305</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-300">
                    FEK Wrapped
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">Cryptographic Key Envelope & Offline BIP-39 Recovery</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  How envelope keys decouple your password from stored payload ciphertext
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">Envelope Hierarchy</span>
                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-mono text-sky-400 block text-[11px]">Master Key (32 bytes)</span>
                      <span>Never stored in plain text anywhere. Decrypted only in local RAM.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-mono text-sky-400 block text-[11px]">Key Encryption Key (KEK)</span>
                      <span>Derived from user master password via Argon2id. Encrypts Master Key.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-mono text-sky-400 block text-[11px]">File Encryption Key (FEK)</span>
                      <span>Unique per file. Encrypted by Master Key. Encrypts file chunks.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">Offline BIP-39 Recovery Kit</span>
                  <p className="text-xs text-slate-400">
                    During registration, an emergency 24-word BIP-39 mnemonic is generated client-side. The mnemonic derives a dedicated recovery key that can unwrap your Master Key envelope independently of your password.
                  </p>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    timber canvas arctic velvet orbit nuclear dynamic horizon ... (24 words)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Zero server custody: If you lose both your password and your 24 words, nobody can unlock the vault.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Security Architecture Matrix (2 Columns - No 3 Cards in a Row) */}
      <section id="architecture" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            System Design
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Cryptographic Security Matrix</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            CloudVault replaces trust in cloud operators with mathematical proofs and verifiable client isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-slate-950 border border-slate-800 text-sky-400">
                <IconLock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Zero-Knowledge Architecture</h3>
                <span className="text-xs text-slate-400">Complete RAM-only key lifecycle</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Neither your plain text password nor unencrypted file payloads are ever transmitted across the network or stored in database tables. The server acts exclusively as an untrusted ciphertext distributor.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-slate-950 border border-slate-800 text-sky-400">
                <IconShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Authenticated Chunk Encryption</h3>
                <span className="text-xs text-slate-400">XChaCha20-Poly1305 with AAD</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Files are sliced into 5 MiB chunks and encrypted with XChaCha20-Poly1305. Each chunk authenticates its index and total size, preventing chunk omission, reordering, and bit-flipping attacks.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-slate-950 border border-slate-800 text-sky-400">
                <IconKey size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Zero-Re-Encryption Password Rotation</h3>
                <span className="text-xs text-slate-400">Envelope encryption model</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When changing your master password, only the 32-byte Master Key envelope is re-wrapped with your newly derived KEK. Terabytes of stored file ciphertext remain completely untouched in object storage.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-slate-950 border border-slate-800 text-sky-400">
                <IconHardDrive size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Regulatory & GDPR Article 17 Erasure</h3>
                <span className="text-xs text-slate-400">Cryptographic shredding</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Execute user data erasure requests on demand. Account deletion permanently deletes all ciphertext objects from cloud object storage, purges metadata, and shreds cryptographic envelopes.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Comparison Table */}
      <section id="comparison" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            Verification
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Security Model Comparison</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compare CloudVault against standard legacy cloud storage providers that maintain server-side custody of keys.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-300">
              <tr>
                <th className="p-4 font-semibold">Security Feature</th>
                <th className="p-4 font-semibold text-sky-400">CloudVault Core</th>
                <th className="p-4 font-semibold text-slate-400">Standard Cloud Providers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              <tr>
                <td className="p-4 font-medium text-slate-200">Key Custody</td>
                <td className="p-4 text-sky-300 font-mono">User device RAM only</td>
                <td className="p-4 text-slate-400">Provider server databases (HSM / KMS)</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-200">Server Compromise Risk</td>
                <td className="p-4 text-sky-300 font-mono">Attacker receives only ciphertext blobs</td>
                <td className="p-4 text-slate-400">Attacker can decrypt all user files</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-200">Metadata & Filename Encryption</td>
                <td className="p-4 text-sky-300 font-mono">Client-side AES-256-GCM obfuscated</td>
                <td className="p-4 text-slate-400">Unencrypted index in cleartext database</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-200">Password Derivation</td>
                <td className="p-4 text-sky-300 font-mono">Argon2id (64 MiB memory cost)</td>
                <td className="p-4 text-slate-400">Legacy bcrypt or PBKDF2</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-200">Data Deletion (GDPR Art. 17)</td>
                <td className="p-4 text-sky-300 font-mono">Cryptographic shredding + physical purge</td>
                <td className="p-4 text-slate-400">Logical soft-delete across replicas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Storage Allocation & Pricing (Single Transparent Structure - No 3 Tiers) */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            Storage Allocation
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Transparent Storage & Zero Hidden Fees</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            CloudVault includes 5 GB of zero-knowledge encrypted storage by default. No hidden fees, no dark patterns, and a 14-day refund guarantee on paid expansions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-mono text-sky-400 uppercase tracking-wider block">Standard Vault</span>
                <h3 className="text-lg font-bold text-slate-100">5 GB Free Core</h3>
              </div>
              <span className="text-xl font-bold text-slate-100 font-mono">$0</span>
            </div>

            <p className="text-xs text-slate-300 mb-6">
              Full zero-knowledge encryption core for individuals. Includes client-side chunking, Web Worker encryption, and 24-word BIP-39 recovery kit.
            </p>

            <div className="space-y-2 text-xs text-slate-300 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Encrypted Storage:</span>
                <span className="font-mono text-slate-200 font-semibold">5 GB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Key Derivation:</span>
                <span className="font-mono text-slate-200 font-semibold">Argon2id Memory-Hard</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Offline Recovery:</span>
                <span className="font-mono text-slate-200 font-semibold">24-Word BIP-39 Kit</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Device Sessions:</span>
                <span className="font-mono text-slate-200 font-semibold">Unlimited</span>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold text-center block transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span className="text-xs font-mono text-sky-400 uppercase tracking-wider block">Expanded Storage</span>
                  <h3 className="text-lg font-bold text-slate-100">Custom Quota Expansion</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">On Demand</span>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Need more than 5 GB? Expand your zero-knowledge storage quota up to 1 TB with simple, predictable pricing and zero egress surcharges.
              </p>

              <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 mb-6">
                <div className="font-semibold text-slate-200">Customer Protection Commitments:</div>
                <div className="text-slate-400">
                  &bull; 14-day no-questions-asked refund policy for all upgrades.<br />
                  &bull; Zero automatic renewal lock-ins or cancellation friction.<br />
                  &bull; Download all your encrypted files before canceling at any time.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <Link to="/refund" className="hover:text-slate-200 underline">
                Read Refund Policy
              </Link>
              <Link to="/terms" className="hover:text-slate-200 underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
            Questions & Answers
          </span>
          <h2 className="text-2xl font-bold text-slate-100">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-white"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <IconChevronUp size={16} className="text-slate-400 shrink-0 ml-2" />
                ) : (
                  <IconChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
                )}
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Compliance & Business Details Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-400">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BrandSquircle size={24} />
              <span className="font-bold text-sm text-slate-100">CloudVault</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero-knowledge client-side encrypted cloud storage engineered for uncompromising privacy and cryptographic data sovereignty.
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-200 block mb-2">Legal & Policies</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/terms" className="hover:text-slate-200 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-200 transition-colors">
                  Privacy Policy (GDPR/CCPA)
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-slate-200 transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-slate-200 block mb-2">Security & Audit</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <span className="text-slate-300">Client Ciphers:</span> XChaCha20 & AES-GCM
              </li>
              <li>
                <span className="text-slate-300">Key Derivation:</span> Argon2id
              </li>
              <li>
                <span className="text-slate-300">Recovery Standard:</span> BIP-39 (24 words)
              </li>
              <li>
                <span className="text-slate-300">Compliance:</span> GDPR Art. 17 Ready
              </li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-slate-200 block mb-2">Corporate Information</span>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>CloudVault Security Systems Inc.</div>
              <div>Registered: Delaware, USA</div>
              <div>DPO Contact: dpo@cloudvault.internal</div>
              <div>Legal Inquiries: legal@cloudvault.internal</div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} CloudVault Security Systems Inc. All rights reserved. Zero telemetry recorded.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-400">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link to="/refund" className="hover:text-slate-400">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
