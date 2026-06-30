import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'Solar Panels',
  'Inverters',
  'Batteries',
  'Mounting Structures',
  'Cables & Accessories',
  'Monitoring Systems',
  'Other',
]

const GST_RATES = [0, 5, 12, 18, 28]

const schema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid price'),
  gstPercent: z.string().min(1, 'Please select a GST rate'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export default function ProductForm({ product, onSubmit, onCancel, isLoading, error }) {
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name || '',
      category: product?.category || '',
      price: product?.price != null ? String(product.price) : '',
      gstPercent: product?.gstPercent != null ? String(product.gstPercent) : '',
      description: product?.description || '',
      isActive: product?.isActive !== false,
    },
  })

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      price: Number(data.price),
      gstPercent: Number(data.gstPercent),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="productName">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="productName"
            placeholder="e.g. 400W Monocrystalline Solar Panel"
            className={cn(errors.name && 'border-destructive')}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={product?.category || ''}
            onValueChange={(val) => setValue('category', val)}
          >
            <SelectTrigger className={cn(errors.category && 'border-destructive')}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>

        {/* GST Percent */}
        <div className="space-y-1.5">
          <Label>
            GST Rate <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={product?.gstPercent != null ? String(product.gstPercent) : ''}
            onValueChange={(val) => setValue('gstPercent', val)}
          >
            <SelectTrigger className={cn(errors.gstPercent && 'border-destructive')}>
              <SelectValue placeholder="Select GST %" />
            </SelectTrigger>
            <SelectContent>
              {GST_RATES.map((rate) => (
                <SelectItem key={rate} value={String(rate)}>
                  {rate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gstPercent && (
            <p className="text-xs text-destructive">{errors.gstPercent.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <Label htmlFor="productPrice">
            Unit Price (INR) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ₹
            </span>
            <Input
              id="productPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={cn('pl-7', errors.price && 'border-destructive')}
              {...register('price')}
            />
          </div>
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        {/* Status (edit only) */}
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              defaultValue={product?.isActive !== false ? 'active' : 'inactive'}
              onValueChange={(val) => setValue('isActive', val === 'active')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="productDesc">Description</Label>
        <textarea
          id="productDesc"
          rows={3}
          placeholder="Optional product description..."
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 resize-none',
            'dark:bg-background dark:text-foreground'
          )}
          {...register('description')}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEdit ? 'Update Product' : 'Add Product'
          )}
        </Button>
      </div>
    </form>
  )
}
