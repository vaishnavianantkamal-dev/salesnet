import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarPlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Wrench,
  MapPin,
  Calendar,
  User,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toaster'
import {
  getInstallationsApi,
  createInstallationApi,
  updateInstallationApi,
} from '@/api/installations.api'
import { getUsersApi } from '@/api/users.api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import InstallationForm from '../components/InstallationForm'

const ITEMS_PER_PAGE = 12

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', icon: RefreshCw, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  rescheduled: { label: 'Rescheduled', icon: Calendar, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, icon: AlertCircle, className: 'bg-muted text-muted-foreground' }
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function InstallationsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [engineerFilter, setEngineerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editInstallation, setEditInstallation] = useState(null)
  const [formError, setFormError] = useState(null)

  const userRole = (user?.role?.name || user?.role || '').toLowerCase()
  const isEngineer = userRole.includes('install') || userRole.includes('engineer') || userRole.includes('technician')

  const params = {
    page,
    limit: ITEMS_PER_PAGE,
    ...(search && { search }),
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
    ...(engineerFilter && engineerFilter !== 'all' && { engineer: engineerFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['installations', params],
    queryFn: async () => {
      const res = await getInstallationsApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-engineers-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 200 })
      return res.data
    },
  })

  const installations = data?.data?.installations || data?.data?.data || []
  const total = data?.data?.meta?.total || data?.data?.total || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1

  const allUsers = usersData?.data?.users || []
  const engineers = allUsers.filter((u) => {
    const roleName = (u.role?.name || u.role || '').toLowerCase()
    return roleName.includes('install') || roleName.includes('engineer') || roleName.includes('technician')
  })
  const engineerList = engineers.length > 0 ? engineers : allUsers

  const createMutation = useMutation({
    mutationFn: createInstallationApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['installations'])
      setCreateOpen(false)
      setFormError(null)
      toast({ title: 'Installation scheduled', description: 'The installation visit has been scheduled.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to schedule installation')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateInstallationApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['installations'])
      setEditInstallation(null)
      setFormError(null)
      toast({ title: 'Installation updated', description: 'Installation details have been updated.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update installation')
    },
  })

  const handleCreate = (data) => {
    setFormError(null)
    createMutation.mutate(data)
  }

  const handleUpdate = (data) => {
    setFormError(null)
    updateMutation.mutate({ id: editInstallation._id, data })
  }

  const handleQuickStatus = (installation, newStatus) => {
    updateMutation.mutate({
      id: installation._id,
      data: { status: newStatus },
    })
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setEngineerFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || (statusFilter && statusFilter !== 'all') || (engineerFilter && engineerFilter !== 'all') || dateFrom || dateTo

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Installations</h1>
          <p className="page-subtitle">Manage field installation visits and engineer assignments</p>
        </div>
        {!isEngineer && (
          <Button onClick={() => { setFormError(null); setCreateOpen(true) }}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Schedule Installation
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lead name or location..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={engineerFilter} onValueChange={(v) => { setEngineerFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Engineers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engineers</SelectItem>
              {engineerList.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="date"
              className="flex-1"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              placeholder="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              className="flex-1"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              placeholder="To date"
            />
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="whitespace-nowrap">
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-4 py-16 border border-border rounded-lg">
          <AlertCircle className="w-10 h-10 text-destructive/50" />
          <div className="text-center">
            <p className="font-medium text-foreground">Failed to load installations</p>
            <p className="text-sm text-muted-foreground mt-1">Check your connection and try again</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : installations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 border-2 border-dashed border-border rounded-lg">
          <Wrench className="w-12 h-12 text-muted-foreground/40" />
          <div className="text-center">
            <p className="font-medium text-foreground">No installations found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilters ? 'Try adjusting your filters' : 'Schedule the first installation visit to get started'}
            </p>
          </div>
          {!isEngineer && !hasFilters && (
            <Button onClick={() => { setFormError(null); setCreateOpen(true) }}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Schedule Installation
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Lead</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Engineer</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Visit Date</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Location</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {installations.map((inst) => {
                  const leadName = inst.lead?.name
                    || `${inst.lead?.firstName || ''} ${inst.lead?.lastName || ''}`.trim()
                    || 'Unknown Lead'
                  const engineerName = inst.engineer?.name
                    || `${inst.engineer?.firstName || ''} ${inst.engineer?.lastName || ''}`.trim()
                    || 'Unassigned'
                  return (
                    <tr key={inst._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{leadName}</div>
                        {inst.lead?.phone && (
                          <div className="text-xs text-muted-foreground mt-0.5">{inst.lead.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground">{engineerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">
                          {inst.visitDate
                            ? format(new Date(inst.visitDate), 'dd MMM yyyy')
                            : '—'}
                        </div>
                        {inst.visitDate && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(inst.visitDate), 'hh:mm a')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-foreground">{inst.location || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setFormError(null); setEditInstallation(inst) }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              {isEngineer ? 'Update Status / Remarks' : 'Edit'}
                            </DropdownMenuItem>
                            {isEngineer && inst.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => handleQuickStatus(inst, 'completed')}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {isEngineer && inst.status === 'scheduled' && (
                              <DropdownMenuItem onClick={() => handleQuickStatus(inst, 'in_progress')}>
                                <RefreshCw className="w-4 h-4 mr-2 text-yellow-600" />
                                Start Installation
                              </DropdownMenuItem>
                            )}
                            {!isEngineer && inst.status !== 'cancelled' && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleQuickStatus(inst, 'cancelled')}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-border">
            {installations.map((inst) => {
              const leadName = inst.lead?.name
                || `${inst.lead?.firstName || ''} ${inst.lead?.lastName || ''}`.trim()
                || 'Unknown Lead'
              const engineerName = inst.engineer?.name
                || `${inst.engineer?.firstName || ''} ${inst.engineer?.lastName || ''}`.trim()
                || 'Unassigned'
              return (
                <div key={inst._id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{leadName}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {engineerName}
                      </div>
                      {inst.visitDate && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(inst.visitDate), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      )}
                      {inst.location && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{inst.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={inst.status} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setFormError(null); setEditInstallation(inst) }}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
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
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Installation Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Installation</DialogTitle>
            <DialogDescription>
              Assign an engineer and schedule a field visit for a lead.
            </DialogDescription>
          </DialogHeader>
          <InstallationForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Installation Dialog */}
      <Dialog open={!!editInstallation} onOpenChange={(open) => !open && setEditInstallation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEngineer ? 'Update Installation' : 'Edit Installation'}</DialogTitle>
            <DialogDescription>
              {isEngineer
                ? 'Update the installation status and add your remarks.'
                : 'Modify the installation details.'}
            </DialogDescription>
          </DialogHeader>
          {editInstallation && (
            <InstallationForm
              installation={editInstallation}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              error={formError}
              isEngineerMode={isEngineer}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
