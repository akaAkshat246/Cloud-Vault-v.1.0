import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';

export interface RecoveryModalProps {
  isOpen: boolean;
  mnemonic: string;
  onConfirmed: () => void;
  onCancel: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  mnemonic,
  onConfirmed,
  onCancel,
}) => {
  const [step, setStep] = useState<'SHOW_PHRASE' | 'CHALLENGE'>('SHOW_PHRASE');
  const [copied, setCopied] = useState(false);
  const words = mnemonic.trim().split(/\s+/);

  // Challenge questions: pick 3 random distinct word indices (1-indexed for human display)
  const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
  const [challengeAnswers, setChallengeAnswers] = useState<{ [key: number]: string }>({});
  const [challengeError, setChallengeError] = useState<string | null>(null);

  useEffect(() => {
    if (words.length === 24) {
      // Pick 3 random distinct indices between 0 and 23
      const pool = Array.from({ length: 24 }, (_, i) => i);
      const picked: number[] = [];
      for (let i = 0; i < 3; i++) {
        const randIdx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(randIdx, 1)[0]);
      }
      picked.sort((a, b) => a - b);
      setChallengeIndices(picked);
      setChallengeAnswers({});
      setChallengeError(null);
      setStep('SHOW_PHRASE');
    }
  }, [mnemonic, isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVerifyChallenge = () => {
    setChallengeError(null);
    for (const idx of challengeIndices) {
      const expected = words[idx]?.toLowerCase();
      const entered = challengeAnswers[idx]?.trim().toLowerCase();
      if (!entered || entered !== expected) {
        setChallengeError(`Word #${idx + 1} does not match. Please check your backup.`);
        return;
      }
    }
    // Successfully verified!
    onConfirmed();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="24-Word Emergency Recovery Kit"
      description="Zero-Escrow Vault Backup. This phrase is the ONLY way to recover your vault if your password is forgotten."
      className="max-w-2xl"
    >
      {step === 'SHOW_PHRASE' ? (
        <div className="space-y-5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Crucial Security Rule:</strong> CloudVault does NOT store your password or recovery phrase. If you lose both, your encrypted data is permanently lost. Write these words down on paper in order.
            </p>
          </div>

          {/* 24 Word Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3.5 bg-[#0a0f1a] rounded-xl border border-slate-800">
            {words.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs"
              >
                <span className="text-[10px] text-slate-500 font-mono w-4 text-right select-none">{idx + 1}.</span>
                <span className="font-mono text-slate-200 font-medium">{word}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Phrase'}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Kit</span>
              </Button>
            </div>

            <Button variant="primary" size="sm" onClick={() => setStep('CHALLENGE')}>
              <span>I Have Saved It → Verify</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Challenge Gate: Enter 3 selected words */
        <div className="space-y-5">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-start gap-3">
            <ShieldCheck className="text-teal-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-teal-200/90 leading-relaxed">
              <strong>Mandatory Verification Challenge:</strong> To ensure you accurately recorded your Emergency Recovery Kit, enter the requested words below before account initialization.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-[#0a0f1a] rounded-xl border border-slate-800">
            {challengeIndices.map((idx) => (
              <Input
                key={idx}
                label={`Enter Word #${idx + 1}:`}
                placeholder={`Type word #${idx + 1}`}
                value={challengeAnswers[idx] || ''}
                onChange={(e) =>
                  setChallengeAnswers({ ...challengeAnswers, [idx]: e.target.value })
                }
              />
            ))}
          </div>

          {challengeError && <p className="text-xs text-red-400 font-medium">{challengeError}</p>}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('SHOW_PHRASE')}>
              ← Back to Words
            </Button>
            <Button variant="primary" size="sm" onClick={handleVerifyChallenge}>
              Confirm & Complete Signup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

