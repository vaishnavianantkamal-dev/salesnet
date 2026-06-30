import { useQuery } from '@tanstack/react-query'
import { Wrench, Clock, CheckCircle, AlertTriangle, MapPin, Calendar } from 'lucide-react'
import axiosInstance from '@/api/axios'
import KpiCard from './KpiCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function JobCard({ job }) {
  const statusClass = statusColors[job.status] || statusColors.pending
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border hover:bg-accent/30 transition-colors">
      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {job.customerName || 'Customer'}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusClass}`}>
            {statusLabels[job.status] || job.status}
          </span>
        </div>
        {job.address && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {job.address}
          </p>
        )}
        {job.scheduledDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {formatDate(job.scheduledDate)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function InstallDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['install-dashboard'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/dashboard/installations')
      return response.data
    },
    retry: 1,
  })

  const summary = data?.data || data || {}
  const jobs = summary.jobs || []

  const kpis = [
    {
      label: 'Assigned Jobs',
      value: summary.assignedJobs ?? 0,
      icon: Wrench,
      color: 'default',
    },
    {
      label: "Today's Jobs",
      value: summary.todayJobs ?? 0,
      icon: Calendar,
      color: 'warm',
    },
    {
      label: 'Completed',
      value: summary.completedJobs ?? 0,
      icon: CheckCircle,
      color: 'success',
    },
    {
      label: 'Pending',
      value: summary.pendingJobs ?? 0,
      icon: Clock,
      color: 'default',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="page-title">Installation Dashboard</h2>
        <p className="page-subtitle">Your assigned jobs and progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-500" />
            My Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-60" />
              <p className="font-medium text-sm">No jobs assigned</p>
              <p className="text-xs mt-1">Jobs will appear here when assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job, i) => (
                <JobCard key={job._id || i} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
