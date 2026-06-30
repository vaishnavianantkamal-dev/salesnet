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
import { getRolesApi } from '@/api/roles.api'
import { getUsersApi } from '@/api/users.api'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
  status: z.string().optional(),
  reportingTo: z.string().optional(),
})

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
  status: z.string().optional(),
  reportingTo: z.string().optional(),
})

export default function UserForm({ user, onSubmit, isLoading, error }) {
  const isEdit = !!user

  const schema = isEdit ? editSchema : createSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      phone: user?.phone || '',
      role: user?.role?._id || user?.role || '',
      status: user?.isActive === false ? 'inactive' : 'active',
      reportingTo: user?.reportingTo?._id || user?.reportingTo || '',
    },
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await getRolesApi()
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

  const roles = rolesData?.data?.roles || []
  const users = usersData?.data?.users || []

  const handleFormSubmit = (data) => {
    const payload = { ...data }
    if (!payload.password) delete payload.password
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            className={cn(errors.name && 'border-destructive')}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@company.com"
            className={cn(errors.email && 'border-destructive')}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">
            Password {!isEdit && <span className="text-destructive">*</span>}
            {isEdit && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep current)</span>}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
            className={cn(errors.password && 'border-destructive')}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            {...register('phone')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Role */}
        <div className="space-y-1.5">
          <Label>
            Role <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={user?.role?._id || user?.role || ''}
            onValueChange={(val) => setValue('role', val)}
          >
            <SelectTrigger className={cn(errors.role && 'border-destructive')}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role._id} value={role._id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={user?.isActive === false ? 'inactive' : 'active'}
            onValueChange={(val) => setValue('status', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reporting To */}
      <div className="space-y-1.5">
        <Label>Reporting To</Label>
        <Select
          defaultValue={user?.reportingTo?._id || user?.reportingTo || ''}
          onValueChange={(val) => setValue('reportingTo', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select manager (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {users
              .filter((u) => u._id !== user?._id)
              .map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name} — {u.role?.name || 'User'}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
            isEdit ? 'Update User' : 'Create User'
          )}
        </Button>
      </div>
    </form>
  )
}
