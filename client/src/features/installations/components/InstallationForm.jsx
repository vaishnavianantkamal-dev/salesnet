import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Search } from 'lucide-react'
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
import axiosInstance from '@/api/axios'
import { cn } from '@/lib/utils'

const schema = z.object({
  lead: z.string().min(1, 'Please select a lead'),
  engineer: z.string().min(1, 'Please select an engineer'),
  visitDate: z.string().min(1, 'Visit date is required'),
  location: z.string().min(2, 'Location is required'),
  remarks: z.string().optional(),
  status: z.string().optional(),
})

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
]

export default function InstallationForm({ installation, onSubmit, isLoading, error, isEngineerMode = false }) {
  const isEdit = !!installation
  const [leadSearch, setLeadSearch] = useState('')
  const [leadSearchDebounced, setLeadSearchDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setLeadSearchDebounced(leadSearch), 400)
    return () => clearTimeout(t)
  }, [leadSearch])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      lead: installation?.lead?._id || installation?.lead || '',
      engineer: installation?.engineer?._id || installation?.engineer || '',
      visitDate: installation?.visitDate
        ? new Date(installation.visitDate).toISOString().slice(0, 16)
        : '',
      location: installation?.location || '',
      remarks: installation?.remarks || '',
      status: installation?.status || 'scheduled',
    },
  })

  const selectedLead = watch('lead')
  const selectedEngineer = watch('engineer')

  // Fetch engineers (users with installation_executive role slug)
  const { data: usersData } = useQuery({
    queryKey: ['users-engineers'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 200 })
      return res.data
    },
  })

  // Fetch leads for search
  const { data: leadsData } = useQuery({
    queryKey: ['leads-search', leadSearchDebounced],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/leads', {
        params: { search: leadSearchDebounced, limit: 30 },
      })
      return res.data
    },
    enabled: !isEdit,
  })

  const allUsers = usersData?.data?.users || []
  const engineers = allUsers.filter((u) => {
    const roleName = (u.role?.name || u.role || '').toLowerCase()
    return (
      roleName.includes('install') ||
      roleName.includes('engineer') ||
      roleName.includes('technician')
    )
  })
  // Fallback: if no filtered engineers, show all users
  const engineerList = engineers.length > 0 ? engineers : allUsers

  const leads = leadsData?.data?.leads || leadsData?.data?.data?.leads || []

  // Display lead name for edit mode
  const currentLeadLabel = isEdit
    ? installation?.lead?.name || installation?.lead?.firstName || 'Lead'
    : null

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      visitDate: new Date(data.visitDate).toISOString(),
    }
    if (!payload.remarks) delete payload.remarks
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Lead selection */}
      {!isEdit ? (
        <div className="space-y-1.5">
          <Label>
            Lead <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search lead by name or phone..."
              className="pl-9"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
            />
          </div>
          {leads.length > 0 && (
            <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-background shadow-md">
              {leads.map((lead) => (
                <button
                  key={lead._id}
                  type="button"
                  onClick={() => {
                    setValue('lead', lead._id)
                    setLeadSearch(lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim())
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                    selectedLead === lead._id && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <span className="font-medium">{lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim()}</span>
                  {lead.phone && (
                    <span className="text-muted-foreground ml-2">{lead.phone}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <input type="hidden" {...register('lead')} />
          {errors.lead && (
            <p className="text-xs text-destructive">{errors.lead.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Lead</Label>
          <Input value={currentLeadLabel} disabled className="bg-muted/50" />
          <input type="hidden" {...register('lead')} />
        </div>
      )}

      {/* Engineer */}
      <div className="space-y-1.5">
        <Label>
          Engineer <span className="text-destructive">*</span>
        </Label>
        <Select
          defaultValue={installation?.engineer?._id || installation?.engineer || ''}
          onValueChange={(val) => setValue('engineer', val)}
          disabled={isEngineerMode}
        >
          <SelectTrigger className={cn(errors.engineer && 'border-destructive')}>
            <SelectValue placeholder="Select engineer" />
          </SelectTrigger>
          <SelectContent>
            {engineerList.map((u) => (
              <SelectItem key={u._id} value={u._id}>
                {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()} — {u.role?.name || 'User'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.engineer && (
          <p className="text-xs text-destructive">{errors.engineer.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Visit Date */}
        <div className="space-y-1.5">
          <Label htmlFor="visitDate">
            Visit Date &amp; Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="visitDate"
            type="datetime-local"
            className={cn(errors.visitDate && 'border-destructive')}
            {...register('visitDate')}
          />
          {errors.visitDate && (
            <p className="text-xs text-destructive">{errors.visitDate.message}</p>
          )}
        </div>

        {/* Status (edit mode only) */}
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              defaultValue={installation?.status || 'scheduled'}
              onValueChange={(val) => setValue('status', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">
          Location / Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          placeholder="Full address or site name"
          className={cn(errors.location && 'border-destructive')}
          {...register('location')}
        />
        {errors.location && (
          <p className="text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          rows={3}
          placeholder="Additional notes, special instructions..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          {...register('remarks')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Scheduling...'}
            </span>
          ) : (
            isEdit ? 'Update Installation' : 'Schedule Installation'
          )}
        </Button>
      </div>
    </form>
  )
}
