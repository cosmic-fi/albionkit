import * as React from "react"
import { Sparkles, Flame, FlaskConical, RefreshCw, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export type NavBadgeVariant = "new" | "hot" | "beta" | "updated" | "coming-soon"

export interface NavBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: NavBadgeVariant
  /** Render only the colored dot (used in collapsed sidebar) */
  dotOnly?: boolean
  /**
   * Optional override for the badge label. If omitted, the component will
   * look up the translated label from the "Navbar.badges" namespace.
   */
  label?: string
}

const variantStyles: Record<NavBadgeVariant, string> = {
  "new": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "hot": "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  "beta": "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  "updated": "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  "coming-soon": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
}

const dotStyles: Record<NavBadgeVariant, string> = {
  "new": "bg-emerald-500",
  "hot": "bg-orange-500",
  "beta": "bg-violet-500",
  "updated": "bg-sky-500",
  "coming-soon": "bg-amber-500",
}

const variantIcons: Record<NavBadgeVariant, React.ComponentType<{ className?: string }>> = {
  "new": Sparkles,
  "hot": Flame,
  "beta": FlaskConical,
  "updated": RefreshCw,
  "coming-soon": Clock,
}

const i18nKey: Record<NavBadgeVariant, string> = {
  "new": "new",
  "hot": "hot",
  "beta": "beta",
  "updated": "updated",
  "coming-soon": "comingSoon",
}

/**
 * NavBadge - a small pill-shaped feature indicator used in the sidebar.
 *
 * Variants:
 *  - new: brand-new feature/page
 *  - hot: trending / popular
 *  - beta: in beta testing
 *  - updated: recently improved
 *  - coming-soon: not released yet
 */
export const NavBadge = React.forwardRef<HTMLSpanElement, NavBadgeProps>(
  ({ variant, dotOnly = false, label, className, ...props }, ref) => {
    const t = useTranslations('Navbar')
    const Icon = variantIcons[variant]
    const text = label ?? t(`badges.${i18nKey[variant]}`)

    if (dotOnly) {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex h-2 w-2 rounded-full ring-2 ring-card",
            dotStyles[variant],
            className
          )}
          title={text}
          aria-label={text}
          {...props}
        />
      )
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider leading-none whitespace-nowrap",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <Icon className="h-2.5 w-2.5" />
        <span>{text}</span>
      </span>
    )
  }
)
NavBadge.displayName = "NavBadge"

export default NavBadge

/**
 * Dot-only variant of the badge. Useful as a tiny indicator on collapsed sidebars.
 */
export const NavBadgeDot = React.forwardRef<HTMLSpanElement, Omit<NavBadgeProps, "dotOnly">>(
  ({ variant, className, label, ...props }, ref) => (
    <NavBadge
      ref={ref}
      variant={variant}
      dotOnly
      label={label}
      className={className}
      {...props}
    />
  )
)
NavBadgeDot.displayName = "NavBadgeDot"
