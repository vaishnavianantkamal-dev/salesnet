import { useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Plus, Trash2, Search, ChevronDown } from 'lucide-react'
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
import { getProductsApi } from '@/api/products.api'
import { cn } from '@/lib/utils'

const lineItemSchema = z.object({
  product: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  qty: z
    .string()
    .min(1, 'Required')
    .refine((v) => Number(v) > 0, 'Must be > 0'),
  unitPrice: z
    .string()
    .min(1, 'Required')
    .refine((v) => Number(v) >= 0, 'Must be >= 0'),
  gstPercent: z.string().min(1, 'Required'),
})

const schema = z.object({
  lead: z.string().min(1, 'Please select a lead'),
  validUntil: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  discountPercent: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), {
      message: 'Discount must be 0–100',
    }),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})

const GST_RATES = [0, 5, 12, 18, 28]

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n || 0)
}

function computeTotals(items, discountPercent) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0
    const price = Number(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const discountAmt = subtotal * ((Number(discountPercent) || 0) / 100)
  const afterDiscount = subtotal - discountAmt

  const gstAmt = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0
    const price = Number(item.unitPrice) || 0
    const base = qty * price
    const share = subtotal > 0 ? base / subtotal : 0
    const discountedBase = base - discountAmt * share
    return sum + discountedBase * ((Number(item.gstPercent) || 0) / 100)
  }, 0)

  return { subtotal, discountAmt, gstAmt, total: afterDiscount + gstAmt }
}

// LeadSearchCombobox — searches leads via users list (adjust API as needed)
function LeadSearchCombobox({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { data } = useQuery({
    queryKey: ['leads-search', query],
    queryFn: async () => {
      // Adjust endpoint to your leads API; using users as placeholder shape
      const res = await getUsersApi({ search: query, limit: 20 })
      return res.data
    },
    enabled: open,
  })

  const leads = data?.data?.users || []

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          error && 'border-destructive',
          'dark:bg-background dark:text-foreground'
        )}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || 'Search and select lead...'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center border-b border-border px-3">
            <Search className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {leads.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No results found</p>
            ) : (
              leads.map((lead) => (
                <button
                  key={lead._id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                  onClick={() => {
                    onChange(lead._id, lead.name)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <span className="font-medium">{lead.name}</span>
                  {lead.email && (
                    <span className="text-muted-foreground text-xs">{lead.email}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuotationForm({ quotation, onSubmit, onCancel, isLoading, error }) {
  const isEdit = !!quotation
  const [selectedLeadLabel, setSelectedLeadLabel] = useState(
    quotation?.lead?.name || quotation?.leadName || ''
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      lead: quotation?.lead?._id || quotation?.lead || '',
      validUntil: quotation?.validUntil ? quotation.validUntil.slice(0, 10) : '',
      terms: quotation?.terms || '',
      notes: quotation?.notes || '',
      discountPercent: quotation?.discountPercent != null ? String(quotation.discountPercent) : '',
      items: quotation?.items?.length
        ? quotation.items.map((item) => ({
            product: item.product?._id || item.product || '',
            productName: item.productName || '',
            qty: String(item.qty || 1),
            unitPrice: String(item.unitPrice || 0),
            gstPercent: String(item.gstPercent ?? 18),
          }))
        : [{ product: '', productName: '', qty: '1', unitPrice: '', gstPercent: '18' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = watch('items')
  const watchedDiscount = watch('discountPercent')
  const { subtotal, discountAmt, gstAmt, total } = computeTotals(watchedItems, watchedDiscount)

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await getProductsApi({ limit: 200 })
      return res.data
    },
  })

  const products = productsData?.data?.products || productsData?.data || []

  const handleProductSelect = useCallback(
    (index, productId) => {
      const product = products.find((p) => p._id === productId)
      if (product) {
        setValue(`items.${index}.product`, product._id)
        setValue(`items.${index}.productName`, product.name)
        setValue(`items.${index}.unitPrice`, String(product.price))
        setValue(`items.${index}.gstPercent`, String(product.gstPercent ?? 18))
      }
    },
    [products, setValue]
  )

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      discountPercent: Number(data.discountPercent) || 0,
      items: data.items.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        gstPercent: Number(item.gstPercent),
      })),
      subtotal,
      discountAmount: discountAmt,
      gstAmount: gstAmt,
      totalAmount: total,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Section: Lead & Validity */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Quotation Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>
              Lead <span className="text-destructive">*</span>
            </Label>
            <LeadSearchCombobox
              value={selectedLeadLabel}
              onChange={(id, name) => {
                setValue('lead', id)
                setSelectedLeadLabel(name)
              }}
              error={errors.lead}
            />
            {errors.lead && (
              <p className="text-xs text-destructive">{errors.lead.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              {...register('validUntil')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discountPercent">Discount (%)</Label>
            <Input
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              className={cn(errors.discountPercent && 'border-destructive')}
              {...register('discountPercent')}
            />
            {errors.discountPercent && (
              <p className="text-xs text-destructive">{errors.discountPercent.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({ product: '', productName: '', qty: '1', unitPrice: '', gstPercent: '18' })
            }
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && (
          <p className="text-xs text-destructive">
            {errors.items.message || 'Please fill all item fields correctly'}
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index] || {}
            const qty = Number(watchedItems?.[index]?.qty) || 0
            const price = Number(watchedItems?.[index]?.unitPrice) || 0
            const lineTotal = qty * price

            return (
              <div
                key={field.id}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground mt-1">
                    Item {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Product Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Product</Label>
                  <Select
                    defaultValue={field.product || ''}
                    onValueChange={(val) => handleProductSelect(index, val)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select product (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Custom item --</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Item description"
                    className={cn('text-sm', itemErrors.productName && 'border-destructive')}
                    {...register(`items.${index}.productName`)}
                  />
                  {itemErrors.productName && (
                    <p className="text-xs text-destructive">{itemErrors.productName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Qty */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Qty <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      className={cn('text-sm', itemErrors.qty && 'border-destructive')}
                      {...register(`items.${index}.qty`)}
                    />
                    {itemErrors.qty && (
                      <p className="text-xs text-destructive">{itemErrors.qty.message}</p>
                    )}
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Unit Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={cn('text-sm pl-5', itemErrors.unitPrice && 'border-destructive')}
                        {...register(`items.${index}.unitPrice`)}
                      />
                    </div>
                    {itemErrors.unitPrice && (
                      <p className="text-xs text-destructive">{itemErrors.unitPrice.message}</p>
                    )}
                  </div>

                  {/* GST % */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      GST % <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      defaultValue={field.gstPercent || '18'}
                      onValueChange={(val) => setValue(`items.${index}.gstPercent`, val)}
                    >
                      <SelectTrigger className={cn('text-sm', itemErrors.gstPercent && 'border-destructive')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {itemErrors.gstPercent && (
                      <p className="text-xs text-destructive">{itemErrors.gstPercent.message}</p>
                    )}
                  </div>

                  {/* Line Total */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Line Total</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-medium text-foreground">
                      ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals Summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount ({watchedDiscount}%)</span>
            <span>- {formatCurrency(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">GST</span>
          <span>{formatCurrency(gstAmt)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2 mt-2">
          <span>Total Amount</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="terms">Terms & Conditions</Label>
          <textarea
            id="terms"
            rows={4}
            placeholder="Payment terms, warranty, delivery conditions..."
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2 resize-none dark:bg-background'
            )}
            {...register('terms')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Internal notes or special instructions..."
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2 resize-none dark:bg-background'
            )}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading}
          onClick={() => setValue('status', 'draft')}
        >
          {isLoading ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          onClick={() => setValue('status', 'sent')}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            isEdit ? 'Update & Send' : 'Create & Send'
          )}
        </Button>
      </div>
    </form>
  )
}
