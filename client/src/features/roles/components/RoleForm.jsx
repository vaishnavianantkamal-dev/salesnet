import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPermissionsApi } from '@/api/roles.api'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  key: z.string().min(2, 'Role key is required').regex(/^[a-z_]+$/, 'Only lowercase letters and underscores allowed'),
  permissions: z.array(z.string()).optional(),
})

// Default permissions grouped by category
const DEFAULT_PERMISSION_GROUPS = {
  'Lead Management': [
    { key: 'lead.view', label: 'View Leads' },
    { key: 'lead.create', label: 'Create Leads' },
    { key: 'lead.edit', label: 'Edit Leads' },
    { key: 'lead.delete', label: 'Delete Leads' },
    { key: 'lead.assign', label: 'Assign Leads' },
    { key: 'lead.export', label: 'Export Leads' },
  ],
  'User Management': [
    { key: 'user.view', label: 'View Users' },
    { key: 'user.manage', label: 'Manage Users' },
    { key: 'user.create', label: 'Create Users' },
    { key: 'user.edit', label: 'Edit Users' },
    { key: 'user.delete', label: 'Delete Users' },
  ],
  'Pipeline & Deals': [
    { key: 'pipeline.view', label: 'View Pipeline' },
    { key: 'pipeline.edit', label: 'Edit Pipeline' },
    { key: 'deal.close', label: 'Close Deals' },
  ],
  'Installations': [
    { key: 'installation.view', label: 'View Installations' },
    { key: 'installation.manage', label: 'Manage Installations' },
    { key: 'installation.assign', label: 'Assign Installations' },
  ],
  'Financial': [
    { key: 'payment.view', label: 'View Payments' },
    { key: 'payment.manage', label: 'Manage Payments' },
    { key: 'quotation.create', label: 'Create Quotations' },
    { key: 'quotation.approve', label: 'Approve Quotations' },
  ],
  'Reports': [
    { key: 'report.view', label: 'View Reports' },
    { key: 'report.export', label: 'Export Reports' },
  ],
}

export default function RoleForm({ role, onSubmit, isLoading, error }) {
  const isEdit = !!role

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await getPermissionsApi()
      return res.data
    },
  })

  const permissionGroups = permissionsData?.data || permissionsData || DEFAULT_PERMISSION_GROUPS

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name || '',
      key: role?.key || '',
      permissions: role?.permissions || [],
    },
  })

  const selectedPermissions = watch('permissions') || []

  const handleNameChange = (e) => {
    const name = e.target.value
    setValue('name', name)
    if (!isEdit) {
      const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
      setValue('key', key)
    }
  }

  const togglePermission = (permKey) => {
    const current = selectedPermissions
    if (current.includes(permKey)) {
      setValue('permissions', current.filter((p) => p !== permKey))
    } else {
      setValue('permissions', [...current, permKey])
    }
  }

  const toggleGroup = (groupPerms) => {
    const keys = groupPerms.map((p) => p.key)
    const allSelected = keys.every((k) => selectedPermissions.includes(k))
    if (allSelected) {
      setValue('permissions', selectedPermissions.filter((p) => !keys.includes(p)))
    } else {
      const newPerms = [...new Set([...selectedPermissions, ...keys])]
      setValue('permissions', newPerms)
    }
  }

  const handleFormSubmit = (data) => {
    onSubmit(data)
  }

  const groups = typeof permissionGroups === 'object' && !Array.isArray(permissionGroups)
    ? permissionGroups
    : DEFAULT_PERMISSION_GROUPS

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="roleName">
            Role Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="roleName"
            placeholder="e.g. Sales Manager"
            className={cn(errors.name && 'border-destructive')}
            {...register('name')}
            onChange={handleNameChange}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="roleKey">
            Role Key <span className="text-destructive">*</span>
          </Label>
          <Input
            id="roleKey"
            placeholder="e.g. sales_manager"
            disabled={isEdit}
            className={cn(errors.key && 'border-destructive', isEdit && 'bg-muted')}
            {...register('key')}
          />
          {errors.key && (
            <p className="text-xs text-destructive">{errors.key.message}</p>
          )}
          {isEdit && (
            <p className="text-xs text-muted-foreground">Role key cannot be changed after creation</p>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Permissions</Label>
          <p className="text-xs text-muted-foreground">
            {selectedPermissions.length} selected
          </p>
        </div>

        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {Object.entries(groups).map(([groupName, perms]) => {
            const groupKeys = Array.isArray(perms) ? perms.map((p) => p.key) : []
            const allSelected = groupKeys.every((k) => selectedPermissions.includes(k))
            const someSelected = groupKeys.some((k) => selectedPermissions.includes(k))

            return (
              <div key={groupName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`group-${groupName}`}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={() => toggleGroup(Array.isArray(perms) ? perms : [])}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <Label
                    htmlFor={`group-${groupName}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {groupName}
                  </Label>
                </div>
                <div className="ml-6 grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {(Array.isArray(perms) ? perms : []).map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEdit ? 'Update Role' : 'Create Role'
          )}
        </Button>
      </div>
    </form>
  )
}
