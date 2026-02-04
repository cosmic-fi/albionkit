import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkAccess } from '@/lib/user-profile';

export function usePremiumAccess() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<'none' | 'premium' | 'guild' | 'alliance' | 'pending_guild'>('none');

  useEffect(() => {
    async function check() {
      if (!user) {
        setHasAccess(false);
        setReason('none');
        setLoading(false);
        return;
      }

      try {
        const result = await checkAccess(user.uid);
        setHasAccess(result.hasAccess);
        setReason(result.reason);
      } catch (error) {
        console.error('Error checking premium access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    check();
  }, [user]);

  return { hasAccess, loading, reason };
}
