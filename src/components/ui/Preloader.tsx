import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PreloaderProps {
  /** Display size: number for pixels, or 'sm' | 'md' | 'lg' for presets (default: 64) */
  size?: number | 'sm' | 'md' | 'lg';
  /** Optional loading text shown below the gif */
  text?: string;
  /** Full-screen centered (default: true) */
  fullScreen?: boolean;
  /** Optional className applied to the inner content wrapper */
  className?: string;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 32,
  lg: 64,
};

export function Preloader({ size = 64, text, fullScreen = true, className }: PreloaderProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size];

  const content = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <Image
        src="/preloader.gif"
        alt="Loading..."
        width={px}
        height={px}
        unoptimized
        priority
      />
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}
