import React from 'react';
import { Hammer, Construction, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useTranslations } from 'next-intl';

interface PageShellProps {
  title: string;
  enableHeader?: boolean;
  showBreadcrumbs?: boolean;
  customBreadcrumbLabel?: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
  isUnderConstruction?: boolean;
  backgroundImage?: string;
  variant?: 'default' | 'gradient' | 'minimal';
  stats?: Array<{
    label: string;
    value: string | number | React.ReactNode;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export function PageShell({
  title,
  enableHeader = true,
  showBreadcrumbs = true,
  customBreadcrumbLabel,
  description,
  icon,
  children,
  headerActions,
  isUnderConstruction,
  backgroundImage,
  variant = 'gradient',
  stats
}: PageShellProps) {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {enableHeader && (
        <div className={`relative border-b border-border/50 flex-shrink-0 ${variant === 'gradient' ? 'bg-gradient-to-br from-primary/5 via-background to-background' : variant === 'minimal' ? '' : 'bg-muted/30'}`}>
          {backgroundImage && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-4 pb-6 pt-10 space-y-6">
            {showBreadcrumbs && <Breadcrumbs lastSegmentLabel={customBreadcrumbLabel || title} />}
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className={`p-2.5 rounded-xl backdrop-blur-sm ${variant === 'gradient' ? 'bg-primary/10 text-primary' : 'bg-card/50 text-primary'}`}>
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">{title}</h1>
                  <p className="text-muted-foreground text-base lg:text-lg mt-1 max-w-2xl">{description}</p>
                </div>
              </div>
              {headerActions && (
                <div className="flex items-center gap-3 lg:flex-shrink-0">
                  {headerActions}
                </div>
              )}
            </div>

            {/* Stats Section */}
            {stats && stats.length > 0 && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                stats.length === 1 ? 'lg:grid-cols-1' :
                stats.length === 2 ? 'lg:grid-cols-2' :
                stats.length === 3 ? 'lg:grid-cols-3' :
                'lg:grid-cols-4'
              } gap-4 pt-2 w-full`}>
                {stats.map((stat, index) => (
                  <StatCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    trend={stat.trend}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-4 py-6 w-full flex-1 overflow-y-auto">
        {isUnderConstruction ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/30 border border-border border-dashed rounded-2xl">
            <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Construction className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">{t('comingSoon')}</h3>
            <p className="text-muted-foreground max-w-md text-center text-base">
              {t('underConstructionDesc', { tool: title.toLowerCase() })}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string; value: string | number | React.ReactNode; icon?: React.ReactNode; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="group bg-card/50 hover:bg-card/80 p-5 rounded-2xl border border-border/50 transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="flex items-center gap-2.5 mb-3">
        {icon ? (
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        ) : (
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        )}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-2xl lg:text-3xl font-black text-foreground">{value}</div>
        {trend && (
          <div className={`flex items-center text-sm font-bold mb-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {trend === 'up' && <TrendingUp className="h-4 w-4 mr-0.5" />}
            {trend === 'down' && <TrendingUp className="h-4 w-4 mr-0.5 rotate-180" />}
            {trend === 'neutral' && <Shield className="h-4 w-4 mr-0.5" />}
          </div>
        )}
      </div>
    </div>
  );
}
