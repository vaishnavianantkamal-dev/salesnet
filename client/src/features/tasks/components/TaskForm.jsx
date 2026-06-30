import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getUsersApi } from '@/api/users.api'
import { getLeadsApi } from '@/api/leads.api'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const taskSchema = z.object({
  lead: z.string().min(1, 'Please select a lead'),
  assignedTo: z.string().min(1, 'Please assign this task to a user'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.string().min(1, 'Please select a task type'),
  dueAt: z.string().min(1, 'Due date is required'),
  remarks: z.string().optional(),
})

const TASK_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'demo', label: 'Demo' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' },
]

export default function TaskForm({ task, onSubmit, isLoading, error }) {
  const isEdit = !!task
  const [leadSearch, setLeadSearch] = useState('')
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(
    task?.lead ? { _id: task.lead._id || task.lead, name: task.lead.name || '' } : null
  )

  const debouncedLeadSearch = useDebounce(leadSearch, 400)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      lead: task?.lead?._id || task?.lead || '',
      assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
      title: task?.title || '',
      type: task?.type || '',
      dueAt: task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
      remarks: task?.remarks || '',
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 100 })
      return res.data
    },
  })

  const { data: leadsData, isFetching: leadsLoading } = useQuery({
    queryKey: ['leads-search', debouncedLeadSearch],
    queryFn: async () => {
      const res = await getLeadsApi({ search: debouncedLeadSearch, limit: 20 })
      return res.data
    },
    enabled: leadDropdownOpen,
  })

  const users = usersData?.data?.users || []
  const leads = leadsData?.data?.leads || []

  const handleLeadSelect = (lead) => {
    setSelectedLead(lead)
    setValue('lead', lead._id)
    setLeadDropdownOpen(false)
    setLeadSearch('')
  }

  const handleClearLead = () => {
    setSelectedLead(null)
    setValue('lead', '')
  }

  const handleFormSubmit = (data) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Lead Autocomplete */}
      <div className="space-y-1.5">
        <Label>
          Lead <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          {selectedLead ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm">
              <span className="flex-1 text-foreground">{selectedLead.name}</span>
              <button
                type="button"
                onClick={handleClearLead}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search lead by name..."
                className={cn('pl-9', errors.lead && 'border-destructive')}
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                onFocus={() => setLeadDropdownOpen(true)}
                onBlur={() => setTimeout(() => setLeadDropdownOpen(false), 150)}
              />
            </div>
          )}
          {leadDropdownOpen && !selectedLead && (
            <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-lg max-h-52 overflow-y-auto">
              {leadsLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
              ) : leads.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No leads found</div>
              ) : (
                leads.map((lead) => (
                  <button
                    key={lead._id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onMouseDown={() => handleLeadSelect(lead)}
                  >
                    <span className="font-medium">{lead.name}</span>
                    {lead.phone && (
                      <span className="ml-2 text-muted-foreground text-xs">{lead.phone}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {errors.lead && (
          <p className="text-xs text-destructive">{errors.lead.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Follow up call with client"
          className={cn(errors.title && 'border-destructive')}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-1.5">
          <Label>
            Type <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={task?.type || ''}
            onValueChange={(val) => setValue('type', val)}
          >
            <SelectTrigger className={cn(errors.type && 'border-destructive')}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type.message}</p>
          )}
        </div>

        {/* Assigned To */}
        <div className="space-y-1.5">
          <Label>
            Assigned To <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={task?.assignedTo?._id || task?.assignedTo || ''}
            onValueChange={(val) => setValue('assignedTo', val)}
          >
            <SelectTrigger className={cn(errors.assignedTo && 'border-destructive')}>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.assignedTo && (
            <p className="text-xs text-destructive">{errors.assignedTo.message}</p>
          )}
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label htmlFor="dueAt">
          Due Date &amp; Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dueAt"
          type="datetime-local"
          className={cn(errors.dueAt && 'border-destructive')}
          {...register('dueAt')}
        />
        {errors.dueAt && (
          <p className="text-xs text-destructive">{errors.dueAt.message}</p>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          rows={3}
          placeholder="Additional notes or context..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:cursor-not-allowed disabled:opacity-50"
          {...register('remarks')}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEdit ? 'Update Task' : 'Create Task'
          )}
        </Button>
      </div>
    </form>
  )
}
