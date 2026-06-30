import { useState } from 'react'
import { ChevronDown, User, Phone, Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemperatureBadge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const STAGES = [
  { value: 'new', label: 'New', color: 'text-slate-500' },
  { value: 'contacted', label: 'Contacted', color: 'text-blue-500' },
  { value: 'qualified', label: 'Qualified', color: 'text-violet-500' },
  { value: 'proposal', label: 'Proposal', color: 'text-amber-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'text-orange-500' },
  { value: 'won', label: 'Won', color: 'text-green-500' },
  { value: 'lost', label: 'Lost', color: 'text-red-500' },
]

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase()
}

function ScoreDots({ score }) {
  const clamped = Math.min(Math.max(Math.round((score || 0) / 20), 0), 5)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'w-2.5 h-2.5',
            i <= clamped
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

export default function PipelineCard({ lead, currentStage, onMoveStage, onCardClick }) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Support both flat fields and nested contact object
  const leadName = lead.contact?.name || lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
  const leadPhone = lead.contact?.phone || lead.phone || null
  const leadTemperature = lead.temperature || lead.temperatureStatus || lead.contact?.temperature

  const assigneeName = lead.assignedTo
    ? typeof lead.assignedTo === 'object'
      ? lead.assignedTo.name ||
        `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`.trim()
      : lead.assignedTo
    : null

  const handleMove = (stage) => {
    if (stage !== currentStage) {
      onMoveStage(lead._id || lead.id, stage)
    }
    setMenuOpen(false)
  }

  const otherStages = STAGES.filter((s) => s.value !== currentStage)

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-3 shadow-sm',
        'hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700',
        'transition-all duration-150 cursor-pointer select-none group'
      )}
      onClick={() => onCardClick?.(lead)}
    >
      {/* Name + temperature */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm text-foreground leading-tight line-clamp-1 flex-1">
          {leadName}
        </p>
        <TemperatureBadge
          temperature={leadTemperature}
          className="text-[10px] py-0 px-1.5 flex-shrink-0"
        />
      </div>

      {/* Phone */}
      {leadPhone && (
        <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span className="text-xs truncate">{leadPhone}</span>
        </div>
      )}

      {/* Score */}
      <div className="flex items-center justify-between mb-3">
        <ScoreDots score={lead.score || lead.leadScore} />
        {lead.estimatedValue != null && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {typeof lead.estimatedValue === 'number'
              ? `₹${lead.estimatedValue.toLocaleString()}`
              : lead.estimatedValue}
          </span>
        )}
      </div>

      {/* Footer: assignee + move dropdown */}
      <div
        className="flex items-center justify-between pt-2 border-t border-border/60"
        onClick={(e) => e.stopPropagation()}
      >
        {assigneeName ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="w-5 h-5 flex-shrink-0">
              <AvatarFallback className="bg-indigo-600 text-white text-[9px] font-semibold">
                {getInitials(assigneeName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate">{assigneeName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/40">
            <User className="w-3 h-3" />
            <span className="text-[10px]">Unassigned</span>
          </div>
        )}

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium text-muted-foreground rounded-lg px-2 py-1',
                'border border-border hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400',
                'transition-colors focus:outline-none'
              )}
              title="Move to stage"
            >
              Move
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">Move to stage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherStages.map((stage) => (
              <DropdownMenuItem
                key={stage.value}
                onClick={() => handleMove(stage.value)}
                className="flex items-center gap-2 cursor-pointer text-xs"
              >
                <ArrowRight className={cn('w-3 h-3', stage.color)} />
                <span>{stage.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
