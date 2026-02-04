'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';

interface LoginModalContextType {
  openLoginModal: (message?: string) => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const openLoginModal = (msg?: string) => {
    setMessage(msg);
    setIsOpen(true);
  };

  const closeLoginModal = () => {
    setIsOpen(false);
    setMessage(undefined);
  };

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal, isLoginModalOpen: isOpen }}>
      {children}
      <LoginModal isOpen={isOpen} onClose={closeLoginModal} message={message} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
}
