export interface PreloaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  text?: string;
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function Preloader({ size = 'md', className = '', showText = false, text }: PreloaderProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <img
        src="/preloader.gif"
        alt="Loading..."
        width={size === 'sm' ? 24 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
        height={size === 'sm' ? 24 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && (
        <p className="text-sm font-medium text-muted-foreground">{text || 'Loading...'}</p>
      )}
    </div>
  );
}
