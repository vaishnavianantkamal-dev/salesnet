import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Lock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import {
  getRolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from '@/api/roles.api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toaster'
import RoleForm from '../components/RoleForm'

const SYSTEM_ROLES = ['super_admin', 'admin']

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState(null)
  const [deleteRole, setDeleteRoleState] = useState(null)
  const [formError, setFormError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await getRolesApi()
      return res.data
    },
  })

  // Backend: { success, message, data: { roles, meta } }
  const roles = data?.data?.roles || []

  const createMutation = useMutation({
    mutationFn: createRoleApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles'])
      setAddDialogOpen(false)
      setFormError(null)
      toast({ title: 'Role created', description: 'New role has been created.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create role')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRoleApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles'])
      setEditRole(null)
      setFormError(null)
      toast({ title: 'Role updated', description: 'Role has been updated.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update role')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['roles'])
      setDeleteRoleState(null)
      toast({ title: 'Role deleted', description: 'Role has been removed.', variant: 'default' })
    },
    onError: (err) => {
      toast({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Cannot delete this role',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-subtitle">Manage roles and their permissions</p>
        </div>
        <Button onClick={() => { setFormError(null); setAddDialogOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Roles grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Shield className="w-10 h-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No roles found</p>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const isSystem = SYSTEM_ROLES.includes(role.key)
            const permCount = role.permissions?.length || 0

            return (
              <Card key={role._id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">
                            {role.name}
                          </h3>
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {role.key}
                          </code>
                        </div>
                      </div>
                    </div>
                    {isSystem && (
                      <div
                        className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full"
                        title="System role - cannot be deleted"
                      >
                        <Lock className="w-3 h-3" />
                        System
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {permCount} permission{permCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Permission preview */}
                  {role.permissions && role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {role.permissions.slice(0, 4).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                      {role.permissions.length > 4 && (
                        <span className="text-xs text-muted-foreground py-0.5">
                          +{role.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setEditRole(role); setFormError(null) }}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                      disabled={isSystem}
                      onClick={() => setDeleteRoleState(role)}
                      title={isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a role with specific permissions for your team members.
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editRole?.name}</DialogTitle>
            <DialogDescription>
              Modify the permissions assigned to this role.
            </DialogDescription>
          </DialogHeader>
          {editRole && (
            <RoleForm
              role={editRole}
              onSubmit={(data) => updateMutation.mutate({ id: editRole._id, data })}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteRole}
        onOpenChange={(open) => !open && setDeleteRoleState(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role{' '}
              <strong>{deleteRole?.name}</strong>? Users with this role will lose their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteRoleState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteRole._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
