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

const followupSchema = z.object({
  lead: z.string().min(1, 'Please select a lead'),
  assignedTo: z.string().min(1, 'Please assign this follow-up to a user'),
  scheduledAt: z.string().min(1, 'Scheduled date and time is required'),
  remarks: z.string().optional(),
  nextFollowupAt: z.string().optional(),
})

export default function FollowupForm({ followup, onSubmit, isLoading, error }) {
  const isEdit = !!followup
  const [leadSearch, setLeadSearch] = useState('')
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(
    followup?.lead
      ? { _id: followup.lead._id || followup.lead, name: followup.lead.name || '' }
      : null
  )

  const debouncedLeadSearch = useDebounce(leadSearch, 400)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      lead: followup?.lead?._id || followup?.lead || '',
      assignedTo: followup?.assignedTo?._id || followup?.assignedTo || '',
      scheduledAt: followup?.scheduledAt
        ? new Date(followup.scheduledAt).toISOString().slice(0, 16)
        : '',
      remarks: followup?.remarks || '',
      nextFollowupAt: followup?.nextFollowupAt
        ? new Date(followup.nextFollowupAt).toISOString().slice(0, 16)
        : '',
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Lead Autocomplete */}
      <div className="space-y-1.5">
        <Label htmlFor="lead-search">
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
                id="lead-search"
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

      {/* Assigned To */}
      <div className="space-y-1.5">
        <Label>
          Assigned To <span className="text-destructive">*</span>
        </Label>
        <Select
          defaultValue={followup?.assignedTo?._id || followup?.assignedTo || ''}
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

      {/* Scheduled At */}
      <div className="space-y-1.5">
        <Label htmlFor="scheduledAt">
          Scheduled Date &amp; Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          className={cn(errors.scheduledAt && 'border-destructive')}
          {...register('scheduledAt')}
        />
        {errors.scheduledAt && (
          <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          rows={3}
          placeholder="Notes, outcome, or context for this follow-up..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:cursor-not-allowed disabled:opacity-50"
          {...register('remarks')}
        />
      </div>

      {/* Next Follow-up At */}
      <div className="space-y-1.5">
        <Label htmlFor="nextFollowupAt">Next Follow-up Date &amp; Time</Label>
        <Input
          id="nextFollowupAt"
          type="datetime-local"
          {...register('nextFollowupAt')}
        />
        <p className="text-xs text-muted-foreground">
          Optionally schedule the next follow-up while logging this one.
        </p>
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
            isEdit ? 'Update Follow-up' : 'Schedule Follow-up'
          )}
        </Button>
      </div>
    </form>
  )
}
