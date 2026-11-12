import React, { useEffect } from 'react';
import { useVault } from '../../hooks/useVault.js';
import { FileList } from '../files/FileList.js';

export const VaultDashboard: React.FC = () => {
  const { refreshVault } = useVault();

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  return (
    <div className="flex-1 flex flex-col">
      <FileList />
    </div>
  );
};

