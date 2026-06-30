import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi, markTaskCompleteApi } from '@/api/tasks.api'
import { getUsersApi } from '@/api/users.api'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import TaskForm from '../components/TaskForm'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 15

const TYPE_COLORS = {
  call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  meeting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  site_visit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  demo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  follow_up: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const TYPE_LABELS = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  site_visit: 'Site Visit',
  demo: 'Demo',
  follow_up: 'Follow Up',
  other: 'Other',
}

function TaskTypeBadge({ type }) {
  const color = TYPE_COLORS[type] || TYPE_COLORS.other
  const label = TYPE_LABELS[type] || type
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  )
}

function DueDateCell({ dueAt, status }) {
  if (!dueAt) return <span className="text-muted-foreground text-xs">—</span>
  const date = new Date(dueAt)
  const overdue = status !== 'completed' && isPast(date) && !isToday(date)
  const dueToday = status !== 'completed' && isToday(date)

  return (
    <span
      className={cn(
        'text-sm font-medium',
        overdue && 'text-red-600 dark:text-red-400',
        dueToday && 'text-amber-600 dark:text-amber-400',
        !overdue && !dueToday && 'text-foreground'
      )}
    >
      {format(date, 'dd MMM yyyy, hh:mm a')}
      {overdue && <span className="ml-1.5 text-xs font-semibold text-red-500 dark:text-red-400">(Overdue)</span>}
      {dueToday && <span className="ml-1.5 text-xs font-semibold text-amber-500">(Today)</span>}
    </span>
  )
}

function TableSkeleton() {
  return Array(6).fill(0).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  ))
}

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTask, setDeleteTaskState] = useState(null)
  const [formError, setFormError] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, debouncedSearch, statusFilter, typeFilter, assignedToFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(assignedToFilter !== 'all' && { assignedTo: assignedToFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      const res = await getTasksApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 100 })
      return res.data
    },
  })

  const tasks = data?.data?.tasks || []
  const total = data?.data?.meta?.total || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const users = usersData?.data?.users || []

  const createMutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setAddDialogOpen(false)
      setFormError(null)
      toast({ title: 'Task created', description: 'New task has been added successfully.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create task')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTaskApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setEditTask(null)
      setFormError(null)
      toast({ title: 'Task updated', description: 'Task has been updated.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update task')
    },
  })

  const completeMutation = useMutation({
    mutationFn: markTaskCompleteApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast({ title: 'Task completed', description: 'Task has been marked as complete.', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update task', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTaskApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setDeleteTaskState(null)
      toast({ title: 'Task deleted', description: 'Task has been removed.', variant: 'default' })
    },
    onError: (err) => {
      toast({ title: 'Delete failed', description: err.response?.data?.message || 'Failed to delete task', variant: 'destructive' })
    },
  })

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.dueAt && isPast(new Date(t.dueAt)) && !isToday(new Date(t.dueAt))
  ).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            Manage and track all sales tasks across your team
          </p>
        </div>
        <Button onClick={() => { setFormError(null); setAddDialogOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {overdueCount} overdue task{overdueCount > 1 ? 's' : ''} on this page require attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assignedToFilter} onValueChange={(v) => { setAssignedToFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map((u) => (
                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">From:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">To:</Label>
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            />
          </div>
          {(dateFrom || dateTo || statusFilter !== 'all' || typeFilter !== 'all' || assignedToFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setStatusFilter('all')
                setTypeFilter('all')
                setAssignedToFilter('all')
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="w-10 h-10 opacity-30" />
                    <p className="font-medium">No tasks found</p>
                    <p className="text-sm">Try adjusting your filters or create a new task</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const overdue =
                  task.status !== 'completed' &&
                  task.dueAt &&
                  isPast(new Date(task.dueAt)) &&
                  !isToday(new Date(task.dueAt))

                return (
                  <TableRow
                    key={task._id}
                    className={cn(overdue && 'bg-red-50/40 dark:bg-red-950/10')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => task.status !== 'completed' && completeMutation.mutate(task._id)}
                          disabled={task.status === 'completed' || completeMutation.isPending}
                          className={cn(
                            'flex-shrink-0 transition-colors',
                            task.status === 'completed'
                              ? 'text-green-500 cursor-default'
                              : 'text-muted-foreground hover:text-green-500'
                          )}
                          title={task.status === 'completed' ? 'Completed' : 'Mark as complete'}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            task.status === 'completed' && 'line-through text-muted-foreground',
                            overdue && 'text-red-700 dark:text-red-400'
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TaskTypeBadge type={task.type} />
                    </TableCell>
                    <TableCell>
                      {task.lead ? (
                        <a
                          href={`/leads/${task.lead._id || task.lead}`}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {task.lead.name || task.lead}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.assignedTo?.name || task.assignedTo || '—'}
                    </TableCell>
                    <TableCell>
                      <DueDateCell dueAt={task.dueAt} status={task.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {task.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => completeMutation.mutate(task._id)}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setEditTask(task); setFormError(null) }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                            onClick={() => setDeleteTaskState(task)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Task
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
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} tasks
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

      {/* Add Task Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={(data) => { setFormError(null); createMutation.mutate(data) }}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          {editTask && (
            <TaskForm
              task={editTask}
              onSubmit={(data) => { setFormError(null); updateMutation.mutate({ id: editTask._id, data }) }}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTask} onOpenChange={(open) => !open && setDeleteTaskState(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Task
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>&ldquo;{deleteTask?.title}&rdquo;</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteTaskState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteTask._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

