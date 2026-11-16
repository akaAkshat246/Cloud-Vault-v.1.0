import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShield } from '../../components/ui/Icons.js';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
            <IconArrowLeft size={16} />
            <span>Return to CloudVault</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Last Updated: November 16, 2026</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/50 text-xs font-semibold text-sky-400 mb-3">
            <IconShield size={14} />
            <span>Legal Compliance & Warranties</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Service</h1>
          <p className="text-sm text-slate-400 mt-2">
            Please read these Terms of Service carefully before utilizing CloudVault zero-knowledge cloud services.
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none text-xs leading-relaxed space-y-8 text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">1. The Zero-Knowledge Storage Agreement</h2>
            <p>
              CloudVault operates strictly on a mathematical zero-knowledge architectural model. All encryption, key derivation (via Argon2id), key wrapping (via AES-256-GCM / XChaCha20-Poly1305), and decryption operations occur exclusively in client memory on your authorized device.
            </p>
            <p>
              CloudVault servers, operators, contractors, and hosting providers never possess, log, transmit, or have the mathematical capability to reconstruct your plaintext Master Password, Master Key, or individual File Encryption Keys (FEK).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">2. User Ownership and Sole Responsibility for Recovery Phrase</h2>
            <p>
              During account registration, CloudVault generates a 24-word BIP-39 Emergency Recovery Kit. You acknowledge and accept sole responsibility for storing this phrase securely offline.
            </p>
            <p className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded text-amber-200">
              <strong>CRITICAL NOTICE:</strong> In the event you forget your master password and misplace your 24-word recovery phrase, CloudVault customer support cannot restore access or reset your credentials. The data stored in your vault will remain cryptographically inaccessible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">3. Acceptable Use and Legal Prohibitions</h2>
            <p>
              You agree not to utilize CloudVault services to store or distribute:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Malware, ransomware, virus payloads, or automated attack scripts.</li>
              <li>Material that infringes upon third-party intellectual property or copyrights.</li>
              <li>Content that violates applicable local, national, or international laws.</li>
            </ul>
            <p>
              Any attempt to disrupt our network, bypass authentication mechanisms, or reverse engineer backend services is grounds for immediate account termination without refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">4. Storage Quotas, Fair Use, and Data Deletion</h2>
            <p>
              Each account tier includes a designated storage quota (5 GB for standard zero-knowledge accounts). File uploads that exceed reserved quota thresholds are rejected by the API layer.
            </p>
            <p>
              Users retain the legal right to request complete account deletion at any time via the Settings console. Upon confirmation, all metadata, database records, and encrypted S3 object chunks are permanently and cryptographically purged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">5. Service Level Agreement and Disclaimer of Warranties</h2>
            <p>
              CloudVault services are provided on an "as-is" and "as-available" basis. While we utilize redundant S3 object storage and enterprise PostgreSQL database replication, we advise maintaining external backups of vital mission-critical documents.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">6. Contact and Corporate Information</h2>
            <p>
              For legal inquiries, subpoenas, or compliance questions:
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-400 space-y-1">
              <div>Entity: CloudVault Storage Technologies Inc.</div>
              <div>Compliance Office: legal@cloudvault.internal</div>
              <div>Data Protection Officer: privacy@cloudvault.internal</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

