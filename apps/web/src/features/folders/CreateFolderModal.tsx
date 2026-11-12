import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { useVault } from '../../hooks/useVault.js';

export interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose }) => {
  const { createFolder } = useVault();
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await createFolder(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Encrypted Folder"
      description="The folder name will be encrypted with your MasterKey before storage."
    >
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Folder Name"
          placeholder="e.g. Tax Returns 2026"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          error={error || undefined}
          autoFocus
          required
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            <FolderPlus size={15} />
            <span>Create Folder</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

