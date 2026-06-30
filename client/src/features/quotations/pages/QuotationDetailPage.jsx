import { useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Printer,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Building2,
  User,
  CalendarDays,
  FileText,
} from 'lucide-react'
import { getQuotationByIdApi, updateQuotationApi } from '@/api/quotations.api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toaster'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-transparent',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    className: 'bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground border-transparent',
  },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.draft
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const printRef = useRef(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const res = await getQuotationByIdApi(id)
      return res.data
    },
    enabled: !!id,
  })

  const quotation = data?.data || data

  const statusMutation = useMutation({
    mutationFn: (status) => updateQuotationApi(id, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries(['quotation', id])
      queryClient.invalidateQueries(['quotations'])
      toast({
        title: 'Status updated',
        description: `Quotation marked as ${status}.`,
        variant: 'success',
      })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' })
    },
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-xl border border-border bg-card p-8 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !quotation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Quotation not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The requested quotation could not be loaded.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/quotations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotations
        </Button>
      </div>
    )
  }

  const items = quotation.items || []
  const subtotal = quotation.subtotal ?? items.reduce((s, i) => s + (i.qty * i.unitPrice), 0)
  const discountAmt = quotation.discountAmount ?? (subtotal * ((quotation.discountPercent || 0) / 100))
  const gstAmt = quotation.gstAmount ?? items.reduce((s, i) => {
    const base = i.qty * i.unitPrice
    return s + base * ((i.gstPercent || 0) / 100)
  }, 0)
  const total = quotation.totalAmount ?? (subtotal - discountAmt + gstAmt)

  const currentStatus = quotation.status?.toLowerCase() || 'draft'

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden space-y-4 animate-fade-in mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Quotation{' '}
                <span className="font-mono text-primary">
                  #{quotation.quotationNumber || id?.slice(-6).toUpperCase()}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">{formatDate(quotation.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={quotation.status} />

            {/* Quick status actions */}
            {currentStatus === 'draft' && (
              <Button
                size="sm"
                onClick={() => statusMutation.mutate('sent')}
                disabled={statusMutation.isPending}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Mark as Sent
              </Button>
            )}
            {currentStatus === 'sent' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => statusMutation.mutate('accepted')}
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => statusMutation.mutate('rejected')}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Reject
                </Button>
              </>
            )}

            <Button size="sm" variant="outline" onClick={() => navigate(`/quotations/${id}/edit`)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Document */}
      <div
        ref={printRef}
        className="rounded-xl border border-border bg-card shadow-sm print:shadow-none print:border-none print:rounded-none"
      >
        {/* Document Header */}
        <div className="p-8 border-b border-border print:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
            {/* Company / Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">SalesNest CRM</h2>
                  <p className="text-xs text-muted-foreground">Solar Energy Solutions</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-56">
                123 Business Park, Tech City
                <br />
                Maharashtra, India 400001
                <br />
                GST: 27XXXXX1234X1Z5
              </p>
            </div>

            {/* Quotation Meta */}
            <div className="text-right space-y-1">
              <h1 className="text-3xl font-bold text-foreground uppercase tracking-wide print:text-2xl">
                Quotation
              </h1>
              <p className="font-mono text-lg text-primary font-semibold">
                #{quotation.quotationNumber || id?.slice(-6).toUpperCase()}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-end gap-2 text-sm">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{formatDate(quotation.createdAt)}</span>
                </div>
                {quotation.validUntil && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span className="font-medium text-foreground">{formatDate(quotation.validUntil)}</span>
                  </div>
                )}
                <div className="print:hidden mt-2">
                  <StatusBadge status={quotation.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-8 py-6 border-b border-border print:px-6 print:py-4">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Bill To
              </p>
              <p className="font-bold text-foreground text-base">
                {quotation.lead?.name || quotation.leadName || '—'}
              </p>
              {quotation.lead?.email && (
                <p className="text-sm text-muted-foreground">{quotation.lead.email}</p>
              )}
              {quotation.lead?.phone && (
                <p className="text-sm text-muted-foreground">{quotation.lead.phone}</p>
              )}
              {quotation.lead?.address && (
                <p className="text-sm text-muted-foreground mt-1">{quotation.lead.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="px-8 py-6 print:px-6 print:py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 print:bg-gray-100">
                  <th className="text-left font-semibold text-muted-foreground px-3 py-2 rounded-l-lg print:rounded-none text-xs uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left font-semibold text-muted-foreground px-3 py-2 text-xs uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right font-semibold text-muted-foreground px-3 py-2 text-xs uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right font-semibold text-muted-foreground px-3 py-2 text-xs uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="text-right font-semibold text-muted-foreground px-3 py-2 text-xs uppercase tracking-wider">
                    GST %
                  </th>
                  <th className="text-right font-semibold text-muted-foreground px-3 py-2 rounded-r-lg print:rounded-none text-xs uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/20 print:hover:bg-transparent">
                    <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-foreground">{item.qty}</td>
                    <td className="px-3 py-3 text-right text-foreground">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{item.gstPercent}%</td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-sm">
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {(quotation.discountPercent > 0 || discountAmt > 0) && (
                <div className="flex justify-between text-sm py-1 text-green-600 dark:text-green-400">
                  <span>Discount ({quotation.discountPercent || 0}%)</span>
                  <span>- {formatCurrency(discountAmt)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">GST</span>
                <span className="font-medium text-foreground">{formatCurrency(gstAmt)}</span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-foreground/20">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-base font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        {(quotation.terms || quotation.notes) && (
          <div className="px-8 py-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6 print:px-6 print:py-4">
            {quotation.terms && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Terms & Conditions
                </h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {quotation.terms}
                </p>
              </div>
            )}
            {quotation.notes && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Notes
                </h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {quotation.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border bg-muted/20 rounded-b-xl print:rounded-none print:px-6 print:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-muted-foreground">
            <p>This quotation is computer-generated and valid as stated above.</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [ref="printRef"], [ref="printRef"] * { visibility: visible; }
          @page { margin: 1cm; }
        }
      `}</style>
    </>
  )
}
