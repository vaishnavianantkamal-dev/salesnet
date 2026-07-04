import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'justdial', label: 'Justdial' },
  { value: 'indiamart', label: 'IndiaMart' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'other', label: 'Other' },
]

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const leadSchema = z.object({
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  contactPhone: z
    .string()
    .min(10, 'Phone must be 10 digits')
    .max(10, 'Phone must be 10 digits')
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  contactEmail: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  contactCompany: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  source: z.string().min(1, 'Please select a source'),
  stage: z.string().optional(),
  priority: z.string().optional(),
  productName: z.string().optional(),
  productEstimatedValue: z.coerce
    .number()
    .min(0, 'Value must be positive')
    .optional()
    .or(z.literal('')),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export default function LeadForm({ lead, onSubmit, isLoading, error }) {
  const isEdit = !!lead

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      contactName: lead?.contact?.name || '',
      contactPhone: lead?.contact?.phone || '',
      contactEmail: lead?.contact?.email || '',
      contactCompany: lead?.contact?.company || '',
      contactCity: lead?.contact?.city || '',
      contactState: lead?.contact?.state || '',
      source: lead?.source || '',
      stage: lead?.stage || 'new',
      priority: lead?.priority || 'medium',
      productName: lead?.product?.name || '',
      productEstimatedValue: lead?.product?.estimatedValue ?? '',
      assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
      notes: lead?.notes || '',
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 200 })
      return res.data
    },
  })

  const users = usersData?.data?.users || []

  const handleFormSubmit = (data) => {
    const payload = {
      contact: {
        name: data.contactName,
        phone: data.contactPhone,
        ...(data.contactEmail && { email: data.contactEmail }),
        ...(data.contactCompany && { company: data.contactCompany }),
        ...(data.contactCity && { city: data.contactCity }),
        ...(data.contactState && { state: data.contactState }),
      },
      source: data.source,
      ...(data.stage && { stage: data.stage }),
      ...(data.priority && { priority: data.priority }),
      ...(data.productName || data.productEstimatedValue !== ''
        ? {
            product: {
              ...(data.productName && { name: data.productName }),
              ...(data.productEstimatedValue !== '' && {
                estimatedValue: Number(data.productEstimatedValue),
              }),
            },
          }
        : {}),
      ...(data.assignedTo && { assignedTo: data.assignedTo }),
      ...(data.notes && { notes: data.notes }),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Contact Information */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Contact Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="contactName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactName"
              placeholder="Ramesh Kumar"
              className={cn(errors.contactName && 'border-destructive')}
              {...register('contactName')}
            />
            {errors.contactName && (
              <p className="text-xs text-destructive">{errors.contactName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              className={cn(errors.contactPhone && 'border-destructive')}
              {...register('contactPhone')}
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="ramesh@example.com"
              className={cn(errors.contactEmail && 'border-destructive')}
              {...register('contactEmail')}
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactCompany">Company</Label>
            <Input
              id="contactCompany"
              placeholder="ABC Pvt Ltd"
              {...register('contactCompany')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactCity">City</Label>
            <Input
              id="contactCity"
              placeholder="Mumbai"
              {...register('contactCity')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactState">State</Label>
            <Input
              id="contactState"
              placeholder="Maharashtra"
              {...register('contactState')}
            />
          </div>
        </div>
      </div>

      {/* Lead Details */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Lead Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              Source <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={lead?.source || ''}
              onValueChange={(val) => setValue('source', val)}
            >
              <SelectTrigger className={cn(errors.source && 'border-destructive')}>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && (
              <p className="text-xs text-destructive">{errors.source.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select
              defaultValue={lead?.stage || 'new'}
              onValueChange={(val) => setValue('stage', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              defaultValue={lead?.priority || 'medium'}
              onValueChange={(val) => setValue('priority', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select
              defaultValue={lead?.assignedTo?._id || lead?.assignedTo || ''}
              onValueChange={(val) => setValue('assignedTo', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Product / Service
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="Solar Panel 5kW"
              {...register('productName')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productEstimatedValue">Estimated Value (₹)</Label>
            <Input
              id="productEstimatedValue"
              type="number"
              min={0}
              placeholder="250000"
              className={cn(errors.productEstimatedValue && 'border-destructive')}
              {...register('productEstimatedValue')}
            />
            {errors.productEstimatedValue && (
              <p className="text-xs text-destructive">
                {errors.productEstimatedValue.message}
              </p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="productQuantity">Quantity</Label>
            <Input
              id="productQuantity"
              type="number"
              min={0}
              placeholder="e.g. 50"
              {...register('productQuantity')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usage">Usage / Purpose</Label>
            <Input
              id="usage"
              placeholder="e.g. Balcony"
              {...register('usage')}
            />
          </div>
        </div>
      </div>

      {/* Requirement & Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Requirement / Description</Label>
        <textarea
          id="description"
          rows={2}
          placeholder="Detailed requirements from the customer..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          {...register('description')}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal Notes</Label>
        <textarea
          id="notes"
          rows={2}
          placeholder="Add any internal notes..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          {...register('notes')}
        />
      </div>

      {/* Attached Images */}
      {lead?.images && lead.images.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Attached Images
          </p>
          <div className="flex flex-wrap gap-3">
            {lead.images.map((imgUrl, i) => (
              <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="relative block h-24 w-24 overflow-hidden rounded-md border border-border shadow-sm hover:opacity-80 transition-opacity">
                <img src={imgUrl} alt="Attached" className="object-cover w-full h-full" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : isEdit ? (
            'Update Lead'
          ) : (
            'Create Lead'
          )}
        </Button>
      </div>
    </form>
  )
}
