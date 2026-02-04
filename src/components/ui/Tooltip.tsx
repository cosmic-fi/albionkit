'use client';

import { useState, useRef, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // 8px above
        left: rect.left + rect.width / 2, // Center
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) setIsVisible(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isVisible]);

  return (
    <>
      <div 
        ref={triggerRef}
        className={`inline-flex items-center gap-1 cursor-help group ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999] px-3 py-2 bg-popover border border-border text-popover-foreground text-xs rounded-lg shadow-xl pointer-events-none max-w-[200px] text-center animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            top: position.top, 
            left: position.left, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-border" />
        </div>,
        document.body
      )}
    </>
  );
}
