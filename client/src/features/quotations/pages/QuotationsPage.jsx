import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Calendar,
} from 'lucide-react'
import { getQuotationsApi, createQuotationApi, updateQuotationApi } from '@/api/quotations.api'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import QuotationForm from '../components/QuotationForm'

const ITEMS_PER_PAGE = 15

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-transparent',
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400',
  },
  expired: {
    label: 'Expired',
    className: 'bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-transparent',
  },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.draft
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function QuotationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editQuotation, setEditQuotation] = useState(null)
  const [formError, setFormError] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, debouncedSearch, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      const res = await getQuotationsApi(params)
      return res.data
    },
    keepPreviousData: true,
  })

  const quotations = data?.data?.quotations || data?.data || []
  const total = data?.data?.meta?.total || quotations.length
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  const createMutation = useMutation({
    mutationFn: createQuotationApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['quotations'])
      setCreateOpen(false)
      setFormError(null)
      toast({ title: 'Quotation created', description: 'Quotation has been saved.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create quotation')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateQuotationApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotations'])
      setEditQuotation(null)
      setFormError(null)
      toast({ title: 'Quotation updated', description: 'Changes have been saved.', variant: 'success' })
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update quotation')
    },
  })

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || (statusFilter && statusFilter !== 'all') || dateFrom || dateTo

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Create and manage sales quotations</p>
        </div>
        <Button onClick={() => { setFormError(null); setCreateOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by quotation no. or lead..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            placeholder="To"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Quotation No.
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Lead
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-full max-w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">No quotations found</p>
                      <p className="text-xs text-muted-foreground">
                        {hasFilters
                          ? 'Try adjusting your filters.'
                          : 'Create your first quotation to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quotations/${q._id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-primary">
                        {q.quotationNumber || q._id?.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {q.lead?.name || q.leadName || '—'}
                        </p>
                        {q.lead?.email && (
                          <p className="text-xs text-muted-foreground">{q.lead.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(q.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(q.validUntil)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(q.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => navigate(`/quotations/${q._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setFormError(null); setEditQuotation(q) }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} quotations
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quotation</DialogTitle>
            <DialogDescription>
              Build a new quotation with line items and pricing details.
            </DialogDescription>
          </DialogHeader>
          <QuotationForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setCreateOpen(false)}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editQuotation} onOpenChange={(open) => !open && setEditQuotation(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>
              Update quotation details and line items.
            </DialogDescription>
          </DialogHeader>
          {editQuotation && (
            <QuotationForm
              quotation={editQuotation}
              onSubmit={(data) => updateMutation.mutate({ id: editQuotation._id, data })}
              onCancel={() => setEditQuotation(null)}
              isLoading={updateMutation.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
