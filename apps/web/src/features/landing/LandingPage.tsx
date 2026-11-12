import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Key, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0a0f1a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 border border-teal-400/30">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent">
              CloudVault
            </span>
            <Badge variant="teal" className="hidden sm:inline-flex">v1.0 Zero-Knowledge</Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Open My Vault</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle Cyber Glow Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Lock size={13} className="text-teal-400" />
              <span>True Zero-Knowledge Architecture — We Can't Read Your Files</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Encrypted in your browser. <br />
              <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Private in the cloud.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every chunk is encrypted client-side using <strong>AES-256-GCM</strong> with keys derived via <strong>Argon2id</strong>. Plaintext filenames, folder trees, and encryption keys never touch our servers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-sm">
                  Create Zero-Knowledge Account
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm">
                  Unlock Existing Vault
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Cryptographic Architecture Card */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 sm:p-10 border border-slate-700/60 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key size={20} className="text-teal-400" />
                  <span>The CloudVault Zero-Knowledge Perimeter</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  How our cryptographic separation mathematically isolates your credentials.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="teal">RFC 9106 Argon2id</Badge>
                <Badge variant="blue">NIST SP 800-38D AES-GCM</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0a0f1a]/80 p-5 rounded-xl border border-slate-800">
                <div className="text-teal-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">1. Client-Side KDF</div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">Dual-Key Derivation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your master password produces an <code>AuthKey</code> (sent over TLS for authentication) and a <code>KEK</code> (retained strictly in RAM). The server never receives your KEK.
                </p>
              </div>

              <div className="bg-[#0a0f1a]/80 p-5 rounded-xl border border-slate-800">
                <div className="text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">2. S3 Chunking</div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">5 MiB Direct-to-S3 Uploads</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Files are sliced into 5 MiB pieces and encrypted with a unique per-file FEK. Chunks stream straight to AWS S3 / MinIO via presigned URLs.
                </p>
              </div>

              <div className="bg-[#0a0f1a]/80 p-5 rounded-xl border border-slate-800">
                <div className="text-purple-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">3. Metadata Privacy</div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">Zero Plaintext Metadata</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Filenames and directory trees are encrypted before reaching PostgreSQL. Database admins and subpoena requests see only opaque base64 blobs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Compare With Mainstream Storage</h2>
            <p className="text-xs sm:text-sm text-slate-400">Why true zero-knowledge privacy makes a mathematical difference.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <thead className="bg-[#0e1726] border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Security Feature</th>
                  <th className="py-3.5 px-4 font-semibold text-teal-400">CloudVault</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Google Drive</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Dropbox</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-medium">Default E2E Encryption</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold flex items-center gap-1.5"><Check size={14} /> Always On</td>
                  <td className="py-3 px-4 text-slate-500">No (Server has keys)</td>
                  <td className="py-3 px-4 text-slate-500">No (Server has keys)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Zero-Knowledge Filenames</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold flex items-center gap-1.5"><Check size={14} /> Encrypted</td>
                  <td className="py-3 px-4 text-slate-500">Plaintext Indexed</td>
                  <td className="py-3 px-4 text-slate-500">Plaintext Indexed</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">24-Word BIP-39 Recovery Kit</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold flex items-center gap-1.5"><Check size={14} /> Supported</td>
                  <td className="py-3 px-4 text-slate-500">No (Email Reset)</td>
                  <td className="py-3 px-4 text-slate-500">No (Email Reset)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Native Memory-Hard KDF</td>
                  <td className="py-3 px-4 text-teal-400 font-semibold flex items-center gap-1.5"><Check size={14} /> Argon2id (64 MiB)</td>
                  <td className="py-3 px-4 text-slate-500">Proprietary / PBKDF2</td>
                  <td className="py-3 px-4 text-slate-500">Bcrypt / PBKDF2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Transparent Commercial Tiers</h2>
            <p className="text-xs sm:text-sm text-slate-400">Zero data harvesting. Pay for honest cloud infrastructure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase mb-2">Free Community</div>
                <div className="text-3xl font-bold text-white mb-1">5 GB</div>
                <div className="text-xs text-slate-500 mb-6">Always Free • Up to 2 Devices</div>
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Full E2EE & Metadata Encryption</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> 24-Word Emergency Recovery Kit</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Progressive Web App (PWA)</li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="secondary" className="w-full text-xs">Start with 5 GB</Button>
              </Link>
            </div>

            {/* Personal Tier */}
            <div className="glass-panel-glow p-6 rounded-2xl border border-teal-500/50 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6">
                <Badge variant="teal">Most Popular</Badge>
              </div>
              <div>
                <div className="text-teal-400 text-xs font-semibold uppercase mb-2">Personal Tier</div>
                <div className="text-3xl font-bold text-white mb-1">100 GB</div>
                <div className="text-xs text-slate-400 mb-6">₹149 / month ($1.99)</div>
                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Unlimited Devices</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> High-speed Direct-to-S3 Bandwidth</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Priority Support & Android Sync</li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="primary" className="w-full text-xs">Upgrade to 100 GB</Button>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-purple-400 text-xs font-semibold uppercase mb-2">Pro Tier</div>
                <div className="text-3xl font-bold text-white mb-1">1 TB</div>
                <div className="text-xs text-slate-500 mb-6">₹349 / month ($4.49)</div>
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> 1,000 GB High-Assurance Storage</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> URL Fragment Password Sharing</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-teal-400" /> Audit Log & Security Export</li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="secondary" className="w-full text-xs">Get 1 TB</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-8 text-center text-xs text-slate-500">
        <p>© 2026 CloudVault Platform. Built with Zero-Knowledge Cryptography.</p>
      </footer>
    </div>
  );
};
