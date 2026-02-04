'use client';

import React from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ServerRegion } from '@/hooks/useServer';

export type { ServerRegion };

interface ServerSelectorProps {
  selectedServer: ServerRegion;
  onServerChange: (server: ServerRegion) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function ServerSelector({ selectedServer, onServerChange, className, size = 'sm' }: ServerSelectorProps) {
  return (
    <SegmentedControl
      options={[
        { value: 'west', label: 'Americas' },
        { value: 'europe', label: 'Europe' },
        { value: 'east', label: 'Asia' },
      ]}
      value={selectedServer}
      onChange={(val) => onServerChange(val as ServerRegion)}
      className={className}
      size={size}
    />
  );
}
