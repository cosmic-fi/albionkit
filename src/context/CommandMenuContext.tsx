'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CommandMenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandMenuContext = createContext<CommandMenuContextType | undefined>(undefined);

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <CommandMenuContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </CommandMenuContext.Provider>
  );
}

export function useCommandMenu() {
  const context = useContext(CommandMenuContext);
  if (context === undefined) {
    throw new Error('useCommandMenu must be used within a CommandMenuProvider');
  }
  return context;
}
