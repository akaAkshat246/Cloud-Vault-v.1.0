import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShield } from '../../components/ui/Icons.js';

export const PrivacyPolicyPage: React.FC = () => {
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
            <span>GDPR & CCPA Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/50 text-xs font-semibold text-sky-400 mb-3">
            <IconShield size={14} />
            <span>Privacy and Data Minimization Policy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mt-2">
            Details on data minimization, zero-knowledge architecture, and your legal rights under GDPR and CCPA.
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none text-xs leading-relaxed space-y-8 text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">1. Principle of Data Minimization</h2>
            <p>
              In accordance with Article 5(1)(c) of the General Data Protection Regulation (GDPR), CloudVault collects solely the minimal technical information required to establish and secure your cryptographic vault session:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>User Account Identification:</strong> Email address (used exclusively for account authentication and recovery challenges).</li>
              <li><strong>Authentication Proof:</strong> Argon2id-derived AuthKey verification hash (bcrypt-hashed server-side). Passwords are never sent or received in plaintext.</li>
              <li><strong>Cryptographic Envelopes:</strong> Encrypted MasterKey envelopes wrapped client-side. We cannot decrypt these envelopes.</li>
              <li><strong>Audit and Security Records:</strong> Session timestamps and IP addresses for brute-force prevention and session revocation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">2. What We Cannot See or Collect</h2>
            <p>
              Because CloudVault enforces end-to-end client-side encryption:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>We cannot read the contents of any uploaded file, photo, video, or document.</li>
              <li>We cannot read file names, folder names, or folder hierarchies (all metadata is AES-256-GCM / XChaCha20 encrypted before transmission).</li>
              <li>We cannot track your browsing habits, sell data to advertisers, or train AI models on your files.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">3. Third-Party Infrastructure and Hosting Audits</h2>
            <p>
              CloudVault self-hosts its infrastructure using dedicated instances and private object storage (MinIO / S3 API compliant). No third-party analytics trackers, social media pixels, or invasive telemetry SDKs are embedded into our web application or native Android APK.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">4. Your Rights: Right to Erasure, Portability, and Rectification</h2>
            <p>
              Under global data privacy laws including GDPR, CCPA, and UK GDPR, you maintain enforceable rights:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Right to Erasure (Article 17 GDPR):</strong> You may permanently delete your account and all stored cryptographic objects via the Account Settings panel. The deletion is irrevocable.</li>
              <li><strong>Right to Portability (Article 20 GDPR):</strong> You may decrypt and download all files and metadata in open formats at any time.</li>
              <li><strong>Right to Object:</strong> We do not engage in automated profiling or behavioral marketing.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">5. Data Retention Schedules</h2>
            <p>
              Active files remain stored until explicitly deleted or trashed by the user. Trashed items are permanently removed according to your retention settings. Incomplete multipart upload chunks are automatically purged after 48 hours to conserve resources.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">6. Contact Our Data Protection Officer (DPO)</h2>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-400 space-y-1">
              <div>Data Protection Office: privacy@cloudvault.internal</div>
              <div>Entity: CloudVault Storage Technologies Inc.</div>
              <div>Inquiries response time: Within 72 hours</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

