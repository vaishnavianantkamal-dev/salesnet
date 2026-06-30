import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  User,
  MessageSquare,
  Send,
  CheckSquare,
  FileText,
  Clock,
  Edit,
  MoreHorizontal,
  Plus,
  Star,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, TemperatureBadge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'
import {
  getLeadByIdApi,
  changeLeadStageApi,
  assignLeadApi,
  getLeadActivitiesApi,
  createLeadNoteApi,
} from '@/api/leads.api'
import { getUsersApi } from '@/api/users.api'
import { formatDate, formatDateTime, formatCurrency, getInitials } from '@/lib/utils'

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

const PRIORITY_COLORS = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-green-600 dark:text-green-400',
}

const ACTIVITY_ICONS = {
  lead_created: { icon: Plus, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  note: { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  assigned: { icon: User, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  stage_changed: { icon: Activity, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  score_changed: { icon: Star, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  call: { icon: Phone, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  message_received: { icon: MessageSquare, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  template_sent: { icon: Send, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  task_created: { icon: CheckSquare, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  task_completed: { icon: CheckSquare, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
}

function ActivityItem({ activity }) {
  const config = ACTIVITY_ICONS[activity.type] || {
    icon: Clock,
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  const Icon = config.icon

  return (
    <div className="flex gap-3 py-3">
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0 pb-3 border-b border-border last:border-0">
        <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {activity.performedBy?.name && (
            <span className="font-medium">{activity.performedBy.name} · </span>
          )}
          {formatDateTime(activity.createdAt)}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOut && (
        <Avatar className="w-7 h-7 mr-2 flex-shrink-0 self-end">
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">L</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${
          isOut
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content || msg.body || msg.message}</p>
        <p
          className={`text-[10px] mt-1.5 ${
            isOut ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
          }`}
        >
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
          {isOut && msg.deliveryStatus && ` · ${msg.deliveryStatus}`}
        </p>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, href, className = '' }) {
  if (!label) return null
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      {href ? (
        <a
          href={href}
          className="text-sm text-foreground hover:text-primary hover:underline truncate transition-colors"
        >
          {label}
        </a>
      ) : (
        <span className="text-sm text-foreground truncate">{label}</span>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'conversation', label: 'Conversation', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'quotations', label: 'Quotations', icon: FileText },
]

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('timeline')
  const [noteText, setNoteText] = useState('')
  const [msgText, setMsgText] = useState('')
  const msgEndRef = useRef(null)

  const { data: leadData, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await getLeadByIdApi(id)
      return res.data
    },
    enabled: !!id,
  })

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: async () => {
      const res = await getLeadActivitiesApi(id, { limit: 50 })
      return res.data
    },
    enabled: !!id,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await getUsersApi({ limit: 200 })
      return res.data
    },
  })

  const lead = leadData?.data?.lead || leadData?.data || null
  const activities = activitiesData?.data?.activities || activitiesData?.data || []
  const users = usersData?.data?.users || []

  useEffect(() => {
    if (activeTab === 'conversation') {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTab])

  const stageMutation = useMutation({
    mutationFn: (stage) => changeLeadStageApi(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', id])
      queryClient.invalidateQueries(['lead-activities', id])
      toast({ title: 'Stage updated', variant: 'success' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update stage',
        variant: 'destructive',
      })
    },
  })

  const assignMutation = useMutation({
    mutationFn: (assignedTo) => assignLeadApi(id, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', id])
      toast({ title: 'Lead assigned', variant: 'success' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign lead',
        variant: 'destructive',
      })
    },
  })

  const noteMutation = useMutation({
    mutationFn: (description) => createLeadNoteApi(id, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-activities', id])
      setNoteText('')
      toast({ title: 'Note added', variant: 'success' })
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add note',
        variant: 'destructive',
      })
    },
  })

  const handleNoteSubmit = () => {
    const text = noteText.trim()
    if (!text) return
    noteMutation.mutate(text)
  }

  const handleMsgKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
    }
  }

  if (isLoading) return <DetailSkeleton />

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Lead not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The lead you're looking for doesn't exist or was deleted.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    )
  }

  const stageKey = lead.stage || 'new'
  const stageColor = STAGE_COLORS[stageKey] || STAGE_COLORS.new
  const stageLabel = STAGES.find((s) => s.value === stageKey)?.label || stageKey

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button + Lead Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 flex-shrink-0"
          onClick={() => navigate('/leads')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-foreground">
              {lead.contact?.name || 'Unknown Lead'}
            </h1>
            <TemperatureBadge temperature={lead.temperature} />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColor}`}>
              {stageLabel}
            </span>
            {lead.score !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Star className="w-3 h-3" />
                Score {lead.score}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[lead.contact?.company, lead.leadId].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Inline stage selector in header */}
        <div className="hidden sm:block flex-shrink-0">
          <Select
            value={stageKey}
            onValueChange={(v) => stageMutation.mutate(v)}
            disabled={stageMutation.isPending}
          >
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== LEFT PANEL ===== */}
        <div className="lg:col-span-2 space-y-0">
          {/* Tab Navigation */}
          <div className="flex gap-0 border-b border-border mb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ---- Timeline Tab ---- */}
          {activeTab === 'timeline' && (
            <Card className="rounded-tl-none">
              <CardContent className="pt-5">
                {/* Add note */}
                <div className="flex gap-2 mb-5">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <textarea
                      rows={2}
                      placeholder="Add a note about this lead..."
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="self-end"
                      disabled={!noteText.trim() || noteMutation.isPending}
                      onClick={handleNoteSubmit}
                    >
                      {noteMutation.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Activity feed */}
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Activity will appear here as actions are taken on this lead
                    </p>
                  </div>
                ) : (
                  <div>
                    {activities.map((activity) => (
                      <ActivityItem key={activity._id} activity={activity} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---- Conversation Tab ---- */}
          {activeTab === 'conversation' && (
            <Card className="rounded-tl-none flex flex-col" style={{ minHeight: 480 }}>
              <CardContent className="flex-1 overflow-y-auto pt-5 pb-2" style={{ maxHeight: 400 }}>
                <div className="flex flex-col justify-end min-h-full">
                  <div className="text-center mb-4">
                    <span className="inline-block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      Conversation with {lead.contact?.name}
                    </span>
                  </div>

                  {/* Placeholder state — conversations API not yet available */}
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                  <div ref={msgEndRef} />
                </div>
              </CardContent>

              {/* Message input */}
              <div className="border-t border-border p-3 flex gap-2 items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 text-xs"
                >
                  Template
                </Button>
                <textarea
                  rows={1}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none min-h-[36px]"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={handleMsgKeyDown}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!msgText.trim()}
                  onClick={() => {
                    toast({
                      title: 'Message sent',
                      description: 'Message queued for delivery.',
                      variant: 'success',
                    })
                    setMsgText('')
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* ---- Tasks Tab ---- */}
          {activeTab === 'tasks' && (
            <Card className="rounded-tl-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tasks</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create tasks to track follow-ups and actions for this lead
                  </p>
                  <Button size="sm" className="mt-4">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create First Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ---- Quotations Tab ---- */}
          {activeTab === 'quotations' && (
            <Card className="rounded-tl-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Quotations</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New Quotation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No quotations yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create a quotation to send pricing information to this lead
                  </p>
                  <Button size="sm" className="mt-4">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Quotation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div className="space-y-4">
          {/* Lead Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Lead Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Source</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                  {lead.source?.replace(/_/g, ' ') || '—'}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Stage (change)</p>
                <Select
                  value={stageKey}
                  onValueChange={(v) => stageMutation.mutate(v)}
                  disabled={stageMutation.isPending}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
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

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Assigned To</p>
                <Select
                  value={lead.assignedTo?._id || lead.assignedTo || ''}
                  onValueChange={(v) => assignMutation.mutate(v)}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Unassigned" />
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

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span
                  className={`font-medium capitalize ${
                    PRIORITY_COLORS[lead.priority] || 'text-foreground'
                  }`}
                >
                  {lead.priority || 'Medium'}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>

              {lead.product?.estimatedValue && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Value</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(lead.product.estimatedValue)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label={lead.contact?.name} />
              <InfoRow
                icon={Phone}
                label={lead.contact?.phone}
                href={`tel:${lead.contact?.phone}`}
              />
              {lead.contact?.email && (
                <InfoRow
                  icon={Mail}
                  label={lead.contact.email}
                  href={`mailto:${lead.contact.email}`}
                />
              )}
              {lead.contact?.company && (
                <InfoRow icon={Building2} label={lead.contact.company} />
              )}
              {(lead.contact?.city || lead.contact?.state) && (
                <InfoRow
                  icon={MapPin}
                  label={[lead.contact.city, lead.contact.state]
                    .filter(Boolean)
                    .join(', ')}
                />
              )}
            </CardContent>
          </Card>

          {/* Score Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Lead Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Score gauge */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    (lead.score || 0) >= 70
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : (lead.score || 0) >= 40
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {lead.score ?? '—'}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(lead.score || 0) >= 70
                      ? 'High Potential'
                      : (lead.score || 0) >= 40
                      ? 'Medium Potential'
                      : 'Low Potential'}
                  </p>
                  <TemperatureBadge temperature={lead.temperature} className="mt-1" />
                </div>
              </div>

              {lead.lastActivity && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="text-foreground">{formatDate(lead.lastActivity)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.contact?.phone && (
                <a
                  href={`https://wa.me/91${lead.contact.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted hover:border-green-300 dark:hover:border-green-700 transition-all"
                >
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  WhatsApp
                </a>
              )}
              {lead.contact?.phone && (
                <a
                  href={`tel:${lead.contact.phone}`}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Call {lead.contact.phone}
                </a>
              )}
              {lead.contact?.email && (
                <a
                  href={`mailto:${lead.contact.email}`}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                >
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Email
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
