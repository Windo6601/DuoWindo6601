import React from 'react';

export interface DomainAccessBlockedModalProps {
  onSimModeChange?: (mode: any) => void;
  currentSimMode?: any;
  userLanguage?: string;
  onContinueWithRisk?: () => void;
}

export const DomainAccessBlockedModal: React.FC<DomainAccessBlockedModalProps> = () => {
  return null;
};
