import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconShield } from '../../components/ui/Icons.js';

export const RefundPolicyPage: React.FC = () => {
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
            <span>Fair Billing Guarantee</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/50 text-xs font-semibold text-sky-400 mb-3">
            <IconShield size={14} />
            <span>Billing Transparency & Ethics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Refund and Cancellation Policy</h1>
          <p className="text-sm text-slate-400 mt-2">
            No dark patterns, no hidden subscription renewals, and transparent cancellation terms.
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none text-xs leading-relaxed space-y-8 text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">1. 14-Day Money-Back Guarantee</h2>
            <p>
              If you purchase a paid storage tier or enterprise dedicated instance and find that CloudVault does not meet your cryptographic security or compliance requirements, you are entitled to a full refund within 14 calendar days of your initial transaction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">2. Zero Hidden Fees</h2>
            <p>
              CloudVault does not charge egress fees, API call fees, or unexpected data transfer surcharges. All quota capacities and pricing are clearly stated upfront with zero hidden calculations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">3. Cancellation and Data Preservation</h2>
            <p>
              You may cancel your subscription at any time directly through the Account console without calling or speaking to a sales representative. Upon cancellation, your access remains active until the end of the billing period.
            </p>
            <p>
              After subscription conclusion, you receive a 30-day grace period to download all decrypted data before your quota reverts to standard community tiers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">4. Submitting a Refund Request</h2>
            <p>
              To request a refund, contact our billing department with your registered account email:
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-400 space-y-1">
              <div>Billing Department: billing@cloudvault.internal</div>
              <div>Processing timeline: 3 to 5 business days</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

