import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Calendar,
  List,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import {
  format,
  isPast,
  isToday,
  isTomorrow,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns'
import { getFollowupsApi, createFollowupApi, updateFollowupApi, deleteFollowupApi } from '@/api/followups.api'
import { getUsersApi } from '@/api/users.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toaster'
import FollowupForm from '../components/FollowupForm'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 15

function StatusBadge({ status }) {
  const configs = {
    scheduled: {
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      dot: 'bg-blue-500',
      label: 'Scheduled',
    },
    completed: {
      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      dot: 'bg-green-500',
      label: 'Completed',
    },
    missed: {
      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dot: 'bg-red-500',
      label: 'Missed',
    },
    cancelled: {
      cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      dot: 'bg-gray-400',
      label: 'Cancelled',
    },
  }
  const config = configs[status] || configs.scheduled
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', config.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

function ScheduledDateCell({ scheduledAt, status }) {
  if (!scheduledAt) return <span className="text-muted-foreground text-xs">—</span>
  const date = new Date(scheduledAt)
  const overdue = status === 'scheduled' && isPast(date) && !isToday(date)
  const today = isToday(date)
  const tomorrow = isTomorrow(date)

  return (
    <div className="space-y-0.5">
      <span
        className={cn(
          'text-sm font-medium',
          overdue && 'text-red-600 dark:text-red-400',
          today && !overdue && 'text-amber-600 dark:text-amber-400',
          !overdue && !today && 'text-foreground'
        )}
      >
        {format(date, 'dd MMM yyyy, hh:mm a')}
      </span>
      {overdue && (
        <p className="text-xs font-semibold text-red-500 dark:text-red-400">Overdue</p>
      )}
      {today && (
        <p className="text-xs font-semibold text-amber-500">Today</p>
      )}
      {tomorrow && (
        <p className="text-xs text-muted-foreground">Tomorrow</p>
      )}
    </div>
  )
}

function TableSkeleton() {
  return Array(6).fill(0).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  ))
}

function CalendarView({ followups, currentMonth, onMonthChange }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const followupsByDay = useMemo(() => {
    const map = {}
    followups.forEach((f) => {
      if (!f.scheduledAt) return
      const key = format(new Date(f.scheduledAt), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(f)
    })
    return map
  }, [followups])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayFollowups = followupsByDay[key] || []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[80px] p-1.5 border-r border-b border-border last:border-r-0',
                !isCurrentMonth && 'opacity-40',
                isCurrentDay && 'bg-primary/5 dark:bg-primary/10'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1',
                  isCurrentDay
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayFollowups.slice(0, 3).map((f) => (
                  <div
                    key={f._id}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                      f.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : f.status === 'missed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}
                    title={`${f.lead?.name || 'Lead'} — ${format(new Date(f.scheduledAt), 'hh:mm a')}`}
                  >
                    {f.lead?.name || 'Follow-up'}
                  </div>
                ))}
                {dayFollowups.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    +{dayFollowups.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FollowupsPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editFollowup, setEditFollowup] = useState(null)
  const [deleteFollowup, setDeleteFollowupState] = useState(null)
  const [formError, setFormError] = useState(null)

  const calendarParams = useMemo(() => ({
    dateFrom: format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    dateTo: format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    limit: 200,
  }), [currentMonth])

  const { data: calendarData } = useQuery({
    queryKey: ['followups-calendar', calendarParams],
    queryFn: async () => {
      const res = await getFollowupsApi(calendarParams)
      return res.data
    },
    enabled: viewMode === 'calendar',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['followups', page, statusFilter, assignedToFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(assignedToFilter !== 'all' && { assignedTo: assignedToFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      const res = await getFollowupsApi(params)
      return res.data
    },
    keepPreviousData: true,
    enabled: viewMode === 'list',
  })

  const { data: overdueData } = useQuery({
    queryKey: ['followups-overdue'],
    queryFn: async () => {
      const res = await getFollowupsApi({
        status: 'scheduled',
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        limit: 50,
      })
      return res.data
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 100 })
      return res.data
    },
  })

  const followups = data?.data?.followups || []
  const total = data?.data?.meta?.total || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const calendarFollowups = calendarData?.data?.followups || []
  const overdueFollowups = (overdueData?.data?.followups || []).filter(
    (f) => f.status === 'scheduled' && f.scheduledAt && isPast(new Date(f.scheduledAt)) && !isToday(new Date(f.scheduledAt))
  )
  const users = usersData?.data?.users || []

  const createMutation = useMutation({
    mutationFn: createFollowupApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['followups'])
      queryClient.invalidateQueries(['followups-overdue'])
      queryClient.invalidateQueries(['followups-calendar'])
      setAddDialogOpen(false)
      setFormError(null)
      toast({ title: 'Follow-up scheduled', description: 'Follow-up has been created successfully.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create follow-up')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFollowupApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups'])
      queryClient.invalidateQueries(['followups-overdue'])
      queryClient.invalidateQueries(['followups-calendar'])
      setEditFollowup(null)
      setFormError(null)
      toast({ title: 'Follow-up updated', description: 'Follow-up has been updated.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update follow-up')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFollowupApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['followups'])
      queryClient.invalidateQueries(['followups-overdue'])
      queryClient.invalidateQueries(['followups-calendar'])
      setDeleteFollowupState(null)
      toast({ title: 'Follow-up deleted', description: 'Follow-up has been removed.', variant: 'default' })
    },
    onError: (err) => {
      toast({ title: 'Delete failed', description: err.response?.data?.message || 'Failed to delete', variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">
            Track and manage all scheduled follow-ups with your leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
          <Button onClick={() => { setFormError(null); setAddDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Follow-up
          </Button>
        </div>
      </div>

      {/* Overdue Section */}
      {overdueFollowups.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200 dark:border-red-900/30">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Overdue Follow-ups ({overdueFollowups.length})
            </h2>
          </div>
          <div className="divide-y divide-red-100 dark:divide-red-900/20">
            {overdueFollowups.slice(0, 5).map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PhoneCall className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate">
                      {f.lead?.name || 'Unknown Lead'}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {f.scheduledAt && format(new Date(f.scheduledAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {f.assignedTo?.name || '—'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/40"
                    onClick={() => { setEditFollowup(f); setFormError(null) }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
            {overdueFollowups.length > 5 && (
              <div className="px-4 py-2 text-xs text-red-500 dark:text-red-400 text-center">
                +{overdueFollowups.length - 5} more overdue follow-ups
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView
          followups={calendarFollowups}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedToFilter} onValueChange={(v) => { setAssignedToFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">From:</span>
                <Input
                  type="date"
                  className="w-40"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">To:</span>
                <Input
                  type="date"
                  className="w-40"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                />
              </div>
              {(statusFilter !== 'all' || assignedToFilter !== 'all' || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStatusFilter('all')
                    setAssignedToFilter('all')
                    setDateFrom('')
                    setDateTo('')
                    setPage(1)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="data-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome / Remarks</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : followups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <PhoneCall className="w-10 h-10 opacity-30" />
                        <p className="font-medium">No follow-ups found</p>
                        <p className="text-sm">Try adjusting your filters or schedule a new follow-up</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  followups.map((f) => {
                    const overdue =
                      f.status === 'scheduled' &&
                      f.scheduledAt &&
                      isPast(new Date(f.scheduledAt)) &&
                      !isToday(new Date(f.scheduledAt))

                    return (
                      <TableRow
                        key={f._id}
                        className={cn(overdue && 'bg-red-50/40 dark:bg-red-950/10')}
                      >
                        <TableCell>
                          {f.lead ? (
                            <a
                              href={`/leads/${f.lead._id || f.lead}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {f.lead.name || f.lead}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ScheduledDateCell scheduledAt={f.scheduledAt} status={f.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.assignedTo?.name || f.assignedTo || '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={f.status} />
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-muted-foreground truncate" title={f.remarks || f.outcome || ''}>
                            {f.remarks || f.outcome || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => { setEditFollowup(f); setFormError(null) }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Follow-up
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                                onClick={() => setDeleteFollowupState(f)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} follow-ups
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Follow-up Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Create a new follow-up and assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <FollowupForm
            onSubmit={(data) => { setFormError(null); createMutation.mutate(data) }}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Follow-up Dialog */}
      <Dialog open={!!editFollowup} onOpenChange={(open) => !open && setEditFollowup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Follow-up</DialogTitle>
            <DialogDescription>Update the follow-up details.</DialogDescription>
          </DialogHeader>
          {editFollowup && (
            <FollowupForm
              followup={editFollowup}
              onSubmit={(data) => { setFormError(null); updateMutation.mutate({ id: editFollowup._id, data }) }}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteFollowup} onOpenChange={(open) => !open && setDeleteFollowupState(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Follow-up
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this follow-up for{' '}
              <strong>{deleteFollowup?.lead?.name || 'this lead'}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteFollowupState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteFollowup._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Follow-up'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
