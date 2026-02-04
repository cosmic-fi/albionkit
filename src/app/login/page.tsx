'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/context/LoginModalContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    // Redirect to home and open login modal
    router.replace('/');
    // Use a small timeout to ensure the navigation happens before the modal opens
    // and to let the home page mount
    setTimeout(() => {
        openLoginModal();
    }, 100);
  }, [router, openLoginModal]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
