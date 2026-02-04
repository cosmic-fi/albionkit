'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type ServerRegion = 'west' | 'east' | 'europe';

export function useServer(defaultRegion: ServerRegion = 'west') {
  const { profile } = useAuth();
  const [server, setServer] = useState<ServerRegion>(defaultRegion);

  useEffect(() => {
    if (profile?.preferences?.defaultServer) {
      const pref = profile.preferences.defaultServer;
      if (pref === 'Asia') setServer('east');
      else if (pref === 'Europe') setServer('europe');
      else if (pref === 'Americas') setServer('west');
    }
  }, [profile]);

  return { server, setServer };
}
