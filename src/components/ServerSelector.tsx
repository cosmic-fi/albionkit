'use client';

import React from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerRegion } from '@/hooks/useServer';
import { useTranslations } from 'next-intl';

export type { ServerRegion };

interface ServerSelectorProps {
  selectedServer: ServerRegion;
  onServerChange: (server: ServerRegion) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function ServerSelector({ selectedServer, onServerChange, className, size = 'sm' }: ServerSelectorProps) {
  const t = useTranslations('ServerSelector');

  return (
    <SegmentedControl
      options={[
        { value: 'west', label: t('west') },
        { value: 'europe', label: t('europe') },
        { value: 'east', label: t('east') },
      ]}
      value={selectedServer}
      onChange={(val) => onServerChange(val as ServerRegion)}
      className={className}
      size={size}
    />
  );
}
