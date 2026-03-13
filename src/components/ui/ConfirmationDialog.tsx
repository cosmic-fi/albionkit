'use client';

import { Modal } from '@/components/Modal';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'primary',
  loading = false
}: ConfirmationDialogProps) {
  const t = useTranslations('Common');
  
  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-black'; // Keep amber for warning for now or map to warning variable if exists
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          {variant === 'danger' && (
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          )}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border"
          >
            {cancelText || t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${getConfirmButtonClass()} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
            {confirmText || t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
