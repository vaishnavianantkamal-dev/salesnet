import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

function useCounter(target, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number') return
    let start = 0
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return count
}

const colorSchemes = {
  default: {
    icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    value: 'text-foreground',
  },
  hot: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  warm: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  cold: {
    icon: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    icon: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
  },
  danger: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color = 'default',
  prefix = '',
  suffix = '',
  className,
}) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0
  const animatedCount = useCounter(numericValue)
  const scheme = colorSchemes[color] || colorSchemes.default

  const displayValue = prefix + animatedCount.toLocaleString() + suffix

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor =
    trend > 0
      ? 'text-green-600 dark:text-green-400'
      : trend < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground'

  return (
    <div className={cn('kpi-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{label}</p>
          <p className={cn('text-2xl font-bold mt-1.5', scheme.value)}>
            {displayValue}
          </p>
          {(trend !== undefined || trendLabel) && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  {Math.abs(trend)}%
                </span>
              )}
              {trendLabel && (
                <span className="text-xs text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', scheme.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
