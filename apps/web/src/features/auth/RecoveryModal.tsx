import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';

export interface RecoveryModalProps {
  mnemonic: string;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  mnemonic,
  isOpen,
  onConfirm,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmedSafely, setConfirmedSafely] = useState(false);

  const words = mnemonic.trim().split(/\s+/);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Your 24-Word Recovery Phrase">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>CRITICAL:</strong> This 24-word recovery phrase is the master key to your encrypted data. CloudVault employees cannot recover your account or reset your password. Store it safely offline.
          </p>
        </div>

        {/* 24-Word Grid matching WhatsApp Reference Spec */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-[#161226] border border-[#352C55]">
          {words.map((word, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#0D0B18] border border-[#352C55]/80 text-xs font-mono"
            >
              <span className="text-[10px] text-[#A3A1BD] w-5 text-right font-sans font-semibold">
                {idx + 1}.
              </span>
              <span className="text-white font-medium truncate">{word}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full sm:w-auto text-[#B090F0] border-[#352C55] hover:border-[#8F6BFF]"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Phrase'}</span>
          </Button>

          <label className="flex items-center gap-2.5 text-xs text-[#A3A1BD] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedSafely}
              onChange={(e) => setConfirmedSafely(e.target.checked)}
              className="rounded bg-[#161226] border-[#352C55] text-[#8F6BFF] focus:ring-[#8F6BFF]"
            />
            <span className="font-medium text-white">I have written down these 24 words safely</span>
          </label>
        </div>

        <div className="pt-4 border-t border-[#352C55] flex justify-end gap-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!confirmedSafely}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            <ShieldCheck size={18} />
            <span>Create My Vault</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
