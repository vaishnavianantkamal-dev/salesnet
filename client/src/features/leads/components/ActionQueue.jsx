import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  MessageSquare,
  Mail,
  ChevronRight,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { getActionQueueApi } from '@/api/leads.api'
import { TemperatureBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials, formatDate } from '@/lib/utils'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const TEMP_ORDER = { hot: 0, warm: 1, cold: 2 }

function ActionQueueSkeleton() {
  return Array(5)
    .fill(0)
    .map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-lg border border-border"
      >
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    ))
}

export default function ActionQueue({ className }) {
  const navigate = useNavigate()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['action-queue'],
    queryFn: async () => {
      const res = await getActionQueueApi()
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })

  const rawLeads = data?.data?.leads || data?.data || []

  const leads = [...rawLeads].sort((a, b) => {
    const tempDiff =
      (TEMP_ORDER[a.temperature?.toLowerCase()] ?? 2) -
      (TEMP_ORDER[b.temperature?.toLowerCase()] ?? 2)
    if (tempDiff !== 0) return tempDiff
    const priorityDiff =
      (PRIORITY_ORDER[a.priority?.toLowerCase()] ?? 1) -
      (PRIORITY_ORDER[b.priority?.toLowerCase()] ?? 1)
    if (priorityDiff !== 0) return priorityDiff
    return (b.score ?? 0) - (a.score ?? 0)
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-base">Action Queue</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Prioritized leads to contact right now
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <ActionQueueSkeleton />
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No leads need immediate attention
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead._id}
              className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/40 transition-all duration-150"
            >
              {/* Avatar */}
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getInitials(lead.contact?.name || '?')}
                </AvatarFallback>
              </Avatar>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">
                    {lead.contact?.name || 'Unknown'}
                  </p>
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.contact?.phone || '—'}
                  </p>
                  {lead.lastActivity && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(lead.lastActivity)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Score pill */}
              {lead.score !== undefined && (
                <span
                  className={`hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 ${
                    lead.score >= 70
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : lead.score >= 40
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {lead.score}
                </span>
              )}

              {/* Quick action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {lead.contact?.phone && (
                  <a
                    href={`https://wa.me/91${lead.contact.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                )}
                {lead.contact?.phone && (
                  <a
                    href={`tel:${lead.contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                {lead.contact?.email && (
                  <a
                    href={`mailto:${lead.contact.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* View arrow */}
              <button
                onClick={() => navigate(`/leads/${lead._id}`)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                title="View lead"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        )}

        {leads.length > 0 && (
          <div className="pt-1">
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground h-8"
              onClick={() => navigate('/leads')}
            >
              View all leads
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
