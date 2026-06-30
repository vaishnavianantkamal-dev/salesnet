import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart2,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  getLeadSourceReportApi,
  getSalesReportApi,
  getExecutiveReportApi,
} from '@/api/reports.api'

const TABS = [
  { id: 'lead-source', label: 'Lead Source', icon: BarChart2 },
  { id: 'sales-funnel', label: 'Sales Funnel', icon: TrendingUp },
  { id: 'team-performance', label: 'Team Performance', icon: Users },
]

function formatCurrency(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

function pct(num, den) {
  if (!den || den === 0) return '0%'
  return `${((num / den) * 100).toFixed(1)}%`
}

function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array(cols).fill(0).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message = 'No data for selected period' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ConversionChip({ value }) {
  const num = parseFloat(value)
  if (isNaN(num)) return <span className="text-muted-foreground">—</span>
  const color = num >= 50 ? 'text-green-600 dark:text-green-400' : num >= 25 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
  const Icon = num >= 50 ? ArrowUpRight : num >= 25 ? Minus : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium', color)}>
      <Icon className="w-3.5 h-3.5" />
      {num.toFixed(1)}%
    </span>
  )
}

// Progress bar component for visual table enhancement
function ProgressBar({ value, max, className }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className={cn('h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

// ----- Lead Source Tab -----
function LeadSourceTab({ dateFrom, dateTo }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-lead-source', dateFrom, dateTo],
    queryFn: async () => {
      const res = await getLeadSourceReportApi({ dateFrom, dateTo })
      return res.data
    },
  })

  const rows = Array.isArray(data?.data?.report) ? data.data.report : []
  const maxCount = Math.max(...rows.map((r) => r.total || 0), 1)

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <AlertCircle className="w-8 h-8 text-destructive/50" />
        <p className="text-sm text-muted-foreground">Failed to load lead source data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          Lead Source Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton cols={5} rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">Source</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Total Leads</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Won</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Lost</th>
                  <th className="text-right font-medium text-muted-foreground py-2 pl-4">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={row.source || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground capitalize">
                        {(row.source || 'unknown').replace(/_/g, ' ')}
                      </div>
                      <ProgressBar value={row.total || 0} max={maxCount} className="mt-1.5 w-32" />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {row.total || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-medium">
                      {row.won || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 font-medium">
                      {row.lost || 0}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <ConversionChip value={row.conversionRate ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td className="py-2 pr-4 font-semibold text-foreground">Total</td>
                  <td className="py-2 px-4 text-right font-semibold text-foreground">
                    {rows.reduce((s, r) => s + (r.total || 0), 0)}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                    {rows.reduce((s, r) => s + (r.won || 0), 0)}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-red-600 dark:text-red-400">
                    {rows.reduce((s, r) => s + (r.lost || 0), 0)}
                  </td>
                  <td className="py-2 pl-4 text-right">
                    <ConversionChip
                      value={
                        rows.reduce((s, r) => s + (r.total || 0), 0) > 0
                          ? (rows.reduce((s, r) => s + (r.won || 0), 0) /
                              rows.reduce((s, r) => s + (r.total || 0), 0)) * 100
                          : 0
                      }
                    />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ----- Sales Funnel Tab -----
function SalesFunnelTab({ dateFrom, dateTo }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-sales-funnel', dateFrom, dateTo],
    queryFn: async () => {
      const res = await getSalesReportApi({ dateFrom, dateTo })
      return res.data
    },
  })

  const rows = Array.isArray(data?.data?.stages) ? data.data.stages : []
  const totalLeads = rows.reduce((s, r) => s + (r.total || 0), 0)
  const maxCount = Math.max(...rows.map((r) => r.total || 0), 1)

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <AlertCircle className="w-8 h-8 text-destructive/50" />
        <p className="text-sm text-muted-foreground">Failed to load sales funnel data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Sales Funnel — Stage Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton cols={4} rows={7} />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">Stage</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Count</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">% of Total</th>
                  <th className="text-left font-medium text-muted-foreground py-2 pl-4 min-w-[120px]">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={row.stage || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-foreground capitalize">
                        {(row.stage || 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {row.total || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {pct(row.total || 0, totalLeads)}
                    </td>
                    <td className="py-3 pl-4">
                      <ProgressBar value={row.total || 0} max={maxCount} className="w-full max-w-[200px]" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td className="py-2 pr-4 font-semibold text-foreground">Total</td>
                  <td className="py-2 px-4 text-right font-semibold text-foreground">
                    {rows.reduce((s, r) => s + (r.total || 0), 0)}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-foreground">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ----- Team Performance Tab -----
function TeamPerformanceTab({ dateFrom, dateTo }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-team-performance', dateFrom, dateTo],
    queryFn: async () => {
      const res = await getExecutiveReportApi({ dateFrom, dateTo })
      return res.data
    },
  })

  const rows = Array.isArray(data?.data?.executives) ? data.data.executives : []
  const maxLeads = Math.max(...rows.map((r) => r.leadsAssigned || 0), 1)

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <AlertCircle className="w-8 h-8 text-destructive/50" />
        <p className="text-sm text-muted-foreground">Failed to load team performance data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-muted-foreground" />
          Team Performance — Per Executive
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton cols={6} rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState message="No executive data for selected period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">#</th>
                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">Executive</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Leads</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Won</th>
                  <th className="text-right font-medium text-muted-foreground py-2 px-4">Conversion</th>
                  <th className="text-right font-medium text-muted-foreground py-2 pl-4">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => {
                  const leads = row.leadsAssigned || row.leads || 0
                  const won = row.dealsWon || row.won || 0
                  const revenue = row.revenue || 0
                  const convRate = leads > 0 ? (won / leads) * 100 : 0
                  const name = row.name || row.executiveName || `Executive ${idx + 1}`
                  return (
                    <tr key={row._id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-foreground">{name}</div>
                        {row.email && (
                          <div className="text-xs text-muted-foreground mt-0.5">{row.email}</div>
                        )}
                        <ProgressBar value={leads} max={maxLeads} className="mt-1.5 w-24" />
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">{leads}</td>
                      <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-medium">
                        {won}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ConversionChip value={convRate} />
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-foreground">
                        {revenue > 0 ? formatCurrency(revenue) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td />
                  <td className="py-2 pr-4 font-semibold text-foreground">Total</td>
                  <td className="py-2 px-4 text-right font-semibold text-foreground">
                    {rows.reduce((s, r) => s + (r.leadsAssigned || r.leads || 0), 0)}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                    {rows.reduce((s, r) => s + (r.dealsWon || r.won || 0), 0)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <ConversionChip
                      value={
                        rows.reduce((s, r) => s + (r.leadsAssigned || r.leads || 0), 0) > 0
                          ? (rows.reduce((s, r) => s + (r.dealsWon || r.won || 0), 0) /
                              rows.reduce((s, r) => s + (r.leadsAssigned || r.leads || 0), 0)) *
                            100
                          : 0
                      }
                    />
                  </td>
                  <td className="py-2 pl-4 text-right font-semibold text-foreground">
                    {formatCurrency(rows.reduce((s, r) => s + (r.revenue || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ----- Main Page -----
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('lead-source')
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const applyPreset = (days) => {
    setDateFrom(format(subDays(new Date(), days), 'yyyy-MM-dd'))
    setDateTo(format(new Date(), 'yyyy-MM-dd'))
  }

  const PRESETS = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: '1y', days: 365 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analyse lead sources, sales funnel, and team performance</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-border rounded-lg bg-muted/30">
        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="dateFrom" className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
            <Input
              id="dateFrom"
              type="date"
              className="w-36 h-8 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dateTo" className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
            <Input
              id="dateTo"
              type="date"
              className="w-36 h-8 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'lead-source' && (
          <LeadSourceTab dateFrom={dateFrom} dateTo={dateTo} />
        )}
        {activeTab === 'sales-funnel' && (
          <SalesFunnelTab dateFrom={dateFrom} dateTo={dateTo} />
        )}
        {activeTab === 'team-performance' && (
          <TeamPerformanceTab dateFrom={dateFrom} dateTo={dateTo} />
        )}
      </div>
    </div>
  )
}
