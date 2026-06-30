import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Flame,
  Thermometer,
  Snowflake,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart2,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import axiosInstance from '@/api/axios'
import KpiCard from './KpiCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

function KpiSkeleton() {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/dashboard/summary')
      return response.data
    },
    retry: 2,
    staleTime: 60 * 1000,
  })

  const summary = data?.data || data || {}

  const kpiCards = [
    {
      label: "Today's Leads",
      value: summary.todayLeads ?? 0,
      icon: Users,
      color: 'default',
      trend: summary.todayLeadsTrend,
      trendLabel: 'vs yesterday',
    },
    {
      label: 'Hot Leads',
      value: summary.hotLeads ?? 0,
      icon: Flame,
      color: 'hot',
      trend: summary.hotLeadsTrend,
      trendLabel: 'this week',
    },
    {
      label: 'Warm Leads',
      value: summary.warmLeads ?? 0,
      icon: Thermometer,
      color: 'warm',
    },
    {
      label: 'Cold Leads',
      value: summary.coldLeads ?? 0,
      icon: Snowflake,
      color: 'cold',
    },
    {
      label: 'Open Deals',
      value: summary.openDeals ?? 0,
      icon: TrendingUp,
      color: 'default',
      trend: summary.openDealsTrend,
      trendLabel: 'this month',
    },
    {
      label: 'Won',
      value: summary.wonDeals ?? 0,
      icon: CheckCircle,
      color: 'success',
      trend: summary.wonTrend,
      trendLabel: 'this month',
    },
    {
      label: 'Lost',
      value: summary.lostDeals ?? 0,
      icon: XCircle,
      color: 'danger',
    },
    {
      label: 'Revenue',
      value: summary.revenue ?? 0,
      icon: DollarSign,
      color: 'success',
      prefix: '₹',
      trend: summary.revenueTrend,
      trendLabel: 'vs last month',
    },
  ]

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Admin Dashboard</h2>
            <p className="page-subtitle">Overview of all sales activities</p>
          </div>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="w-12 h-12 text-destructive/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">Failed to load dashboard data</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.response?.data?.message || error?.message || 'An error occurred'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle">
            Overview of all sales activities and team performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(8).fill(0).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards.map((card) => (
              <KpiCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                trend={card.trend}
                trendLabel={card.trendLabel}
                prefix={card.prefix}
              />
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Pipeline Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              Lead Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={summary.pipeline || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'hsl(var(--accent))' }}
                  />
                  <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={summary.monthly || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    formatter={(v, name) => [
                      name === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v,
                      name === 'revenue' ? 'Revenue' : 'Deals',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deals"
                    name="deals"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981' }}
                    yAxisId={0}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Team Performance — This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          ) : !summary.team?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No team activity this month yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.team.map((member, idx) => {
                const maxLeads = summary.team[0]?.leads || 1
                const pct = Math.round((member.leads / maxLeads) * 100)
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-muted-foreground text-right flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-indigo-600/15 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {member.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{member.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {member.leads} leads · {member.won} won
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground flex-shrink-0 w-20 text-right">
                      ₹{member.revenue >= 1000 ? `${(member.revenue / 1000).toFixed(0)}k` : member.revenue}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
