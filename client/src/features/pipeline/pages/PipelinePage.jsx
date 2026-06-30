import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Kanban, TrendingUp, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import PipelineCard from '../components/PipelineCard'
import axiosInstance from '@/api/axios'

const STAGES = [
  {
    value: 'new',
    label: 'New',
    color: 'border-t-slate-400',
    headerBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeCls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    color: 'border-t-blue-400',
    headerBg: 'bg-blue-50/60 dark:bg-blue-950/20',
    badgeCls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-400',
  },
  {
    value: 'qualified',
    label: 'Qualified',
    color: 'border-t-violet-400',
    headerBg: 'bg-violet-50/60 dark:bg-violet-950/20',
    badgeCls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    dot: 'bg-violet-400',
  },
  {
    value: 'proposal',
    label: 'Proposal',
    color: 'border-t-amber-400',
    headerBg: 'bg-amber-50/60 dark:bg-amber-950/20',
    badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    color: 'border-t-orange-400',
    headerBg: 'bg-orange-50/60 dark:bg-orange-950/20',
    badgeCls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dot: 'bg-orange-400',
  },
  {
    value: 'won',
    label: 'Won',
    color: 'border-t-green-400',
    headerBg: 'bg-green-50/60 dark:bg-green-950/20',
    badgeCls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-400',
  },
  {
    value: 'lost',
    label: 'Lost',
    color: 'border-t-red-400',
    headerBg: 'bg-red-50/60 dark:bg-red-950/20',
    badgeCls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-400',
  },
]

function formatCurrency(value) {
  if (!value && value !== 0) return null
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}

function ColumnSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PipelineColumn({ stage, leads, onMoveStage, onAddLead, onCardClick }) {
  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

  return (
    <div className={cn(
      'flex flex-col flex-shrink-0 w-72 rounded-xl border border-border bg-card',
      'border-t-4', stage.color,
      'shadow-sm'
    )}>
      {/* Column header */}
      <div className={cn('px-3 py-2.5 rounded-t-lg', stage.headerBg)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', stage.dot)} />
            <span className="font-semibold text-sm text-foreground">{stage.label}</span>
          </div>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', stage.badgeCls)}>
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-medium">{formatCurrency(totalValue)}</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-15rem)] px-2 py-2">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <LayoutGrid className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/50">No leads in this stage</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <PipelineCard
                key={lead._id || lead.id}
                lead={lead}
                currentStage={stage.value}
                onMoveStage={onMoveStage}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add lead button */}
      <div className="px-2 py-2 border-t border-border/60">
        <button
          onClick={() => onAddLead(stage.value)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs',
            'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            'border border-dashed border-border hover:border-indigo-400'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Lead
        </button>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const queryClient = useQueryClient()
  const [selectedLead, setSelectedLead] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/leads', {
        params: { limit: 500, page: 1 },
      })
      return res.data?.data?.leads || res.data?.leads || res.data?.data || []
    },
    refetchInterval: 60000,
  })

  const leads = Array.isArray(data) ? data : []

  const leadsByStage = useMemo(() => {
    const grouped = {}
    STAGES.forEach((s) => { grouped[s.value] = [] })

    // Normalize stage aliases from the backend
    const normalizeStage = (raw) => {
      const s = (raw || 'new').toLowerCase()
      const aliases = {
        proposal_sent: 'proposal',
        on_hold: 'negotiation',
        'in-progress': 'contacted',
      }
      return aliases[s] || s
    }

    leads.forEach((lead) => {
      const stage = normalizeStage(lead.stage || lead.status)
      if (grouped[stage]) {
        grouped[stage].push(lead)
      } else {
        grouped['new'].push(lead)
      }
    })

    return grouped
  }, [leads])

  const moveMutation = useMutation({
    mutationFn: async ({ leadId, stage }) => {
      const res = await axiosInstance.patch(`/api/leads/${leadId}`, { stage })
      return res.data
    },
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries(['pipeline-leads'])
      const previous = queryClient.getQueryData(['pipeline-leads'])

      queryClient.setQueryData(['pipeline-leads'], (old) => {
        if (!Array.isArray(old)) return old
        return old.map((l) =>
          (l._id || l.id) === leadId ? { ...l, stage } : l
        )
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['pipeline-leads'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pipeline-leads'])
    },
  })

  const handleMoveStage = (leadId, stage) => {
    moveMutation.mutate({ leadId, stage })
  }

  const handleAddLead = (stage) => {
    console.info('[Pipeline] Add lead to stage:', stage)
  }

  const handleCardClick = (lead) => {
    setSelectedLead(lead)
  }

  const totalLeads = leads.length
  const wonLeads = leadsByStage['won']?.length || 0
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

  return (
    <div className="flex flex-col h-full -mx-6 -my-6">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Kanban className="w-5 h-5 text-indigo-500" />
              Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your leads across all sales stages
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-lg font-bold text-foreground">{totalLeads}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Won</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{wonLeads}</p>
            </div>
            {totalPipelineValue > 0 && (
              <div className="text-right hidden md:block">
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(totalPipelineValue)}
                </p>
              </div>
            )}
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-5 h-full min-w-max">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.value}
              stage={stage}
              leads={isLoading ? [] : (leadsByStage[stage.value] || [])}
              onMoveStage={handleMoveStage}
              onAddLead={handleAddLead}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* Loading overlay columns */}
      {isLoading && (
        <div className="absolute inset-0 flex gap-4 p-5 pointer-events-none overflow-hidden">
          {STAGES.map((stage) => (
            <div
              key={stage.value}
              className={cn(
                'flex-shrink-0 w-72 rounded-xl border border-border bg-card border-t-4 p-3',
                stage.color
              )}
            >
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <ColumnSkeleton />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
