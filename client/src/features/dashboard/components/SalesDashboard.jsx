import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Flame,
  Calendar,
  CheckCircle,
  Phone,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import axiosInstance from '@/api/axios'
import KpiCard from './KpiCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, TemperatureBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDateTime, getInitials } from '@/lib/utils'

function ContactCard({ lead }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group cursor-pointer">
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(lead.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
          <TemperatureBadge temperature={lead.temperature} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
        {lead.nextAction && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lead.nextAction}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button size="icon-sm" variant="ghost" className="w-8 h-8">
          <Phone className="w-3.5 h-3.5" />
        </Button>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export default function SalesDashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['sales-dashboard-summary'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/dashboard/my-summary')
      return response.data
    },
    retry: 1,
  })

  const { data: actionQueueData, isLoading: queueLoading } = useQuery({
    queryKey: ['leads-action-queue'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/leads/action-queue')
      return response.data
    },
    retry: 1,
    staleTime: 30 * 1000,
  })

  const summary = summaryData?.data || summaryData || {}
  const actionQueue = actionQueueData?.data || actionQueueData || []

  const kpis = [
    {
      label: 'My Open Leads',
      value: summary.openLeads ?? 0,
      icon: Users,
      color: 'default',
    },
    {
      label: 'Hot Leads',
      value: summary.hotLeads ?? 0,
      icon: Flame,
      color: 'hot',
    },
    {
      label: "Follow-ups Today",
      value: summary.followupsToday ?? 0,
      icon: Calendar,
      color: 'warm',
    },
    {
      label: 'Won This Month',
      value: summary.wonThisMonth ?? 0,
      icon: CheckCircle,
      color: 'success',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="page-title">My Dashboard</h2>
        <p className="page-subtitle">Your sales activity overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="kpi-card">
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          : kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
              />
            ))}
      </div>

      {/* Who to contact now */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              Who to Contact Now
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {actionQueue.length} leads
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : actionQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-60" />
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs mt-1">No urgent contacts right now</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionQueue.slice(0, 8).map((lead, index) => (
                <ContactCard key={lead._id || index} lead={lead} />
              ))}
              {actionQueue.length > 8 && (
                <Button variant="ghost" className="w-full text-sm mt-2">
                  View all {actionQueue.length} contacts
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Today's Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <div className="text-center text-muted-foreground">
                <Calendar className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Follow-up details coming soon</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
