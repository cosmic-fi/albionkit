'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    info: 'bg-primary text-primary-foreground hover:bg-primary/90',
  };

  const iconColors = {
    danger: 'text-destructive',
    warning: 'text-amber-500',
    info: 'text-primary',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 bg-muted rounded-lg ${iconColors[variant]}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6">{description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className={`flex-1 ${variant !== 'danger' ? variantStyles[variant] : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
