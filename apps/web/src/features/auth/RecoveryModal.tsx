import React, { useState } from 'react';
import {
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconShieldCheck,
} from '../../components/ui/Icons.js';
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
      <div className="space-y-5 text-slate-200">
        <div className="p-3.5 rounded bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-200">
          <IconAlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>CRITICAL:</strong> This 24-word recovery phrase is the only master key to your encrypted data. CloudVault cannot recover your account or reset your password. Store it safely offline.
          </p>
        </div>

        {/* 24-Word Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
          {words.map((word, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono"
            >
              <span className="text-[10px] text-slate-500 w-5 text-right font-sans font-semibold">
                {idx + 1}.
              </span>
              <span className="text-slate-100 font-medium truncate">{word}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full sm:w-auto"
          >
            {copied ? <IconCheck size={14} className="text-emerald-400" /> : <IconCopy size={14} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Phrase'}</span>
          </Button>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedSafely}
              onChange={(e) => setConfirmedSafely(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500"
            />
            <span className="font-medium text-slate-200">I have recorded these 24 words safely</span>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!confirmedSafely}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            <IconShieldCheck size={16} />
            <span>Create Encrypted Vault</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
