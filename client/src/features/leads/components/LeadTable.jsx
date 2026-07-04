import { useDispatch } from 'react-redux'
import { openLeadModal } from '@/features/ui/uiSlice'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  ArrowRightCircle,
  Eye,
  Crosshair,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge, TemperatureBadge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, getInitials } from '@/lib/utils'

const SOURCE_LABELS = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  cold_call: 'Cold Call',
  email_campaign: 'Email Campaign',
  walk_in: 'Walk In',
  exhibition: 'Exhibition',
  justdial: 'Justdial',
  indiamart: 'IndiaMart',
  google_ads: 'Google Ads',
  facebook_ads: 'Facebook Ads',
  other: 'Other',
}

const STAGE_COLORS = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  qualified: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  proposal_sent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  won: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  on_hold: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
}

function TableSkeleton() {
  return Array(8)
    .fill(0)
    .map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-28" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24 rounded-full" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-10 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded" />
        </TableCell>
      </TableRow>
    ))
}

export default function LeadTable({
  leads = [],
  isLoading,
  onEdit,
  onDelete,
  onAssign,
  onStageChange,
  on360,
}) {
  const dispatch = useDispatch()

  return (
    <div className="data-table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Temperature</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No leads found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or add a new lead
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const stageKey = lead.stage || 'new'
              const stageColor = STAGE_COLORS[stageKey] || STAGE_COLORS.new

              return (
                <TableRow
                  key={lead._id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => dispatch(openLeadModal(lead._id))}
                >
                  {/* Lead Name */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      className="cursor-pointer"
                      onClick={() => dispatch(openLeadModal(lead._id))}
                    >
                      <p className="font-medium text-sm text-foreground">
                        {lead.contact?.name || '—'}
                      </p>
                      {lead.contact?.company && (
                        <p className="text-xs text-muted-foreground">
                          {lead.contact.company}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Phone */}
                  <TableCell
                    className="text-sm text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={`tel:${lead.contact?.phone}`}
                      className="hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lead.contact?.phone || '—'}
                    </a>
                  </TableCell>

                  {/* Source */}
                  <TableCell>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {SOURCE_LABELS[lead.source] || lead.source || '—'}
                    </Badge>
                  </TableCell>

                  {/* Temperature */}
                  <TableCell>
                    <TemperatureBadge temperature={lead.temperature} />
                  </TableCell>

                  {/* Stage */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${stageColor}`}
                    >
                      {STAGE_LABELS[stageKey] || stageKey}
                    </span>
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell>
                    {lead.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(lead.assignedTo?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {lead.assignedTo?.name || '—'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Score */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ${
                        (lead.score || 0) >= 70
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : (lead.score || 0) >= 40
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {lead.score ?? '—'}
                    </span>
                  </TableCell>

                  {/* Created At */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {on360 && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                          title="Lead 360° Intelligence"
                          onClick={(e) => { e.stopPropagation(); on360(lead) }}
                        >
                          <Crosshair className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => on360 && on360(lead)}>
                            <Crosshair className="w-4 h-4 mr-2 text-indigo-500" />
                            Lead 360°
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => dispatch(openLeadModal(lead._id))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(lead)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAssign(lead)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Reassign
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStageChange(lead)}>
                            <ArrowRightCircle className="w-4 h-4 mr-2" />
                            Change Stage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                            onClick={() => onDelete(lead)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
