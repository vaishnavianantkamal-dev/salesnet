import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success/10 text-success-600',
        warning:
          'border-transparent bg-warning/10 text-warning-600',
        info:
          'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

const temperatureConfig = {
  hot: {
    label: 'Hot',
    className: 'bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400',
  },
  warm: {
    label: 'Warm',
    className: 'bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400',
  },
  cold: {
    label: 'Cold',
    className: 'bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400',
  },
}

function TemperatureBadge({ temperature, className }) {
  const config = temperatureConfig[temperature?.toLowerCase()] || temperatureConfig.cold
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
        config.className,
        className
      )}
    >
      <span className="mr-1">●</span>
      {config.label}
    </span>
  )
}

export { Badge, badgeVariants, TemperatureBadge }
