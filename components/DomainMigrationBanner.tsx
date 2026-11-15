import React from 'react';

export interface DomainMigrationBannerProps {
  userLanguage?: string;
  onOpenDetails?: () => void;
  playSound?: (sound: any) => void;
}

export const DomainMigrationBanner: React.FC<DomainMigrationBannerProps> = () => {
  return null;
};
