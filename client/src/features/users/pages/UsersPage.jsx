import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  getUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from '@/api/users.api'
import { getRolesApi } from '@/api/roles.api'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog as AlertDialog,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
  DialogFooter as AlertDialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import UserTable from '../components/UserTable'
import UserForm from '../components/UserForm'

const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUserState] = useState(null)
  const [formError, setFormError] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      }
      const res = await getUsersApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await getRolesApi()
      return res.data
    },
  })

  // Backend: { success, message, data: { users, meta } }
  const users = data?.data?.users || []
  const total = data?.data?.meta?.total || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  // Backend: { success, message, data: { roles, meta } }
  const roles = rolesData?.data?.roles || []

  const createMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setAddDialogOpen(false)
      setFormError(null)
      toast({ title: 'User created', description: 'New user has been added successfully.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUserApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setEditUser(null)
      setFormError(null)
      toast({ title: 'User updated', description: 'User has been updated successfully.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setDeleteUserState(null)
      toast({ title: 'User deleted', description: 'User has been removed.', variant: 'default' })
    },
    onError: (err) => {
      toast({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (user) => updateUserApi(user._id, { isActive: !user.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast({ title: 'Status updated', description: 'User status has been changed.', variant: 'success' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to toggle status',
        variant: 'destructive',
      })
    },
  })

  const handleCreate = (formData) => {
    setFormError(null)
    createMutation.mutate(formData)
  }

  const handleEdit = (formData) => {
    setFormError(null)
    updateMutation.mutate({ id: editUser._id, data: formData })
  }

  const handleDelete = () => {
    if (deleteUser) {
      deleteMutation.mutate(deleteUser._id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Manage team members, roles, and permissions
          </p>
        </div>
        <Button onClick={() => { setFormError(null); setAddDialogOpen(true) }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => { setRoleFilter(v); setPage(1) }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role._id} value={role._id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={(user) => { setEditUser(user); setFormError(null) }}
        onDelete={(user) => setDeleteUserState(user)}
        onToggleStatus={(user) => toggleMutation.mutate(user)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} users
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

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new team member account. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignments.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <UserForm
              user={editUser}
              onSubmit={handleEdit}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUserState(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteUser?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteUserState(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
