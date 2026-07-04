import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Search,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  getLeadsApi,
  createLeadApi,
  updateLeadApi,
  deleteLeadApi,
  assignLeadApi,
  changeLeadStageApi,
  importLeadsApi,
} from '@/api/leads.api'
import { getUsersApi } from '@/api/users.api'
import { useDebounce } from '@/hooks/useDebounce'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import LeadTable from '../components/LeadTable'
import LeadForm from '../components/LeadForm'
import Lead360Panel from '../components/Lead360Panel'

const ITEMS_PER_PAGE = 15

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

function exportLeadsToCSV(leads) {
  const headers = [
    'Name',
    'Phone',
    'Email',
    'Company',
    'City',
    'State',
    'Source',
    'Stage',
    'Temperature',
    'Priority',
    'Score',
    'Assigned To',
    'Product',
    'Estimated Value',
    'Created At',
  ]

  const rows = leads.map((lead) => [
    lead.contact?.name || '',
    lead.contact?.phone || '',
    lead.contact?.email || '',
    lead.contact?.company || '',
    lead.contact?.city || '',
    lead.contact?.state || '',
    lead.source || '',
    lead.stage || '',
    lead.temperature || '',
    lead.priority || '',
    lead.score ?? '',
    lead.assignedTo?.name || '',
    lead.product?.name || '',
    lead.product?.estimatedValue ?? '',
    lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `leads-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [temperatureFilter, setTemperatureFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [deleteLead, setDeleteLeadState] = useState(null)
  const [assignLead, setAssignLead] = useState(null)
  const [stageLead, setStageLead] = useState(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [newStage, setNewStage] = useState('')
  const [formError, setFormError] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [lead360, setLead360] = useState(null) // { _id, contact }  — triggers panel

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: [
      'leads',
      page,
      debouncedSearch,
      sourceFilter,
      temperatureFilter,
      stageFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(sourceFilter && sourceFilter !== 'all' && { source: sourceFilter }),
        ...(temperatureFilter &&
          temperatureFilter !== 'all' && { temperature: temperatureFilter }),
        ...(stageFilter && stageFilter !== 'all' && { stage: stageFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      const res = await getLeadsApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 200 })
      return res.data
    },
  })

  const leads = data?.data?.leads || []
  const total = data?.data?.meta?.total || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1
  const users = usersData?.data?.users || []

  const createMutation = useMutation({
    mutationFn: createLeadApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      setAddDialogOpen(false)
      setFormError(null)
      toast({
        title: 'Lead created',
        description: 'New lead has been added successfully.',
        variant: 'success',
      })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create lead')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLeadApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      setEditLead(null)
      setFormError(null)
      toast({
        title: 'Lead updated',
        description: 'Lead has been updated successfully.',
        variant: 'success',
      })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update lead')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLeadApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      setDeleteLeadState(null)
      toast({
        title: 'Lead deleted',
        description: 'Lead has been removed.',
        variant: 'default',
      })
    },
    onError: (err) => {
      toast({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete lead',
        variant: 'destructive',
      })
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedTo }) => assignLeadApi(id, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      setAssignLead(null)
      setAssignUserId('')
      toast({
        title: 'Lead assigned',
        description: 'Lead has been reassigned.',
        variant: 'success',
      })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign lead',
        variant: 'destructive',
      })
    },
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => changeLeadStageApi(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      setStageLead(null)
      setNewStage('')
      toast({
        title: 'Stage updated',
        description: 'Lead stage has been changed.',
        variant: 'success',
      })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to change stage',
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
    updateMutation.mutate({ id: editLead._id, data: formData })
  }

  const handleDelete = () => {
    if (deleteLead) deleteMutation.mutate(deleteLead._id)
  }

  const handleAssign = () => {
    if (assignLead) assignMutation.mutate({ id: assignLead._id, assignedTo: assignUserId })
  }

  const handleStageChange = () => {
    if (stageLead && newStage) stageMutation.mutate({ id: stageLead._id, stage: newStage })
  }

  const handleExport = () => {
    if (leads.length === 0) {
      toast({ title: 'No data', description: 'There are no leads to export.', variant: 'default' })
      return
    }
    exportLeadsToCSV(leads)
    toast({ title: 'Export started', description: `Exporting ${leads.length} leads to CSV.`, variant: 'success' })
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Please select a CSV file.', variant: 'destructive' })
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setIsImporting(true)
    try {
      const res = await importLeadsApi(formData)
      const count = res.data?.data?.imported || res.data?.data?.count || 0
      queryClient.invalidateQueries(['leads'])
      toast({ title: 'Import successful', description: `${count} leads imported successfully.`, variant: 'success' })
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err.response?.data?.message || 'Failed to import leads.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  const hasActiveFilters = sourceFilter || temperatureFilter || stageFilter || dateFrom || dateTo

  const clearFilters = () => {
    setSourceFilter('')
    setTemperatureFilter('')
    setStageFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            {total > 0 ? `${total} total leads` : 'Manage and track your sales leads'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Importing...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries(['leads'])}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Refresh
          </Button>
          <Button
            onClick={() => {
              setFormError(null)
              setAddDialogOpen(true)
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, company..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters((p) => !p)}
            className="shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {[sourceFilter, temperatureFilter, stageFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground shrink-0"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-lg border border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Source</Label>
              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Select
                value={temperatureFilter}
                onValueChange={(v) => {
                  setTemperatureFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stage</Label>
              <Select
                value={stageFilter}
                onValueChange={(v) => {
                  setStageFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date Range</Label>
              <div className="flex gap-1.5 items-center">
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                />
                <span className="text-muted-foreground text-xs shrink-0">to</span>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        onEdit={(lead) => {
          setEditLead(lead)
          setFormError(null)
        }}
        onDelete={(lead) => setDeleteLeadState(lead)}
        onAssign={(lead) => {
          setAssignLead(lead)
          setAssignUserId(lead.assignedTo?._id || '')
        }}
        onStageChange={(lead) => {
          setStageLead(lead)
          setNewStage(lead.stage || 'new')
        }}
        on360={(lead) => setLead360(lead)}
      />

      {/* Lead 360° Panel */}
      {lead360 && (
        <Lead360Panel
          leadId={lead360._id}
          leadName={lead360.contact?.name}
          onClose={() => setLead360(null)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of{' '}
            {total} leads
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

      {/* Add Lead Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead's contact details and initial information.
            </DialogDescription>
          </DialogHeader>
          <LeadForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editLead} onOpenChange={(open) => !open && setEditLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information and assignment details.
            </DialogDescription>
          </DialogHeader>
          {editLead && (
            <LeadForm
              lead={editLead}
              onSubmit={handleEdit}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteLead} onOpenChange={(open) => !open && setDeleteLeadState(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteLead?.contact?.name}</strong>? This action cannot be undone and
              all associated activities will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteLeadState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignLead} onOpenChange={(open) => !open && setAssignLead(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Lead</DialogTitle>
            <DialogDescription>
              Assign <strong>{assignLead?.contact?.name}</strong> to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
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
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignLead(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stage Change Dialog */}
      <Dialog open={!!stageLead} onOpenChange={(open) => !open && setStageLead(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Stage</DialogTitle>
            <DialogDescription>
              Update the stage for <strong>{stageLead?.contact?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={newStage} onValueChange={setNewStage}>
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
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStageLead(null)}>
                Cancel
              </Button>
              <Button onClick={handleStageChange} disabled={stageMutation.isPending || !newStage}>
                {stageMutation.isPending ? 'Updating...' : 'Update Stage'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
