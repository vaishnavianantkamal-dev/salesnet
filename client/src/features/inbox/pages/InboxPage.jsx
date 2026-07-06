import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Send,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  X,
  Check,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { socket } from '@/app/socket'
import { getInboxApi, getConversationsApi, sendMessageApi, sendTemplateApi, markConversationReadApi } from '@/api/conversations.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, TemperatureBadge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import NewChatModal from '../components/NewChatModal'

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, activeBg: 'bg-[#25D366]', inactiveIcon: 'text-[#25D366]' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, activeBg: 'bg-[#1877F2]', inactiveIcon: 'text-[#1877F2]' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, activeBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]', inactiveIcon: 'text-[#dc2743]' },
]

const SAMPLE_TEMPLATES = [
  { id: 't1', name: 'Follow-up', body: 'Hi {{name}}, just following up on our previous conversation. Are you still interested?' },
  { id: 't2', name: 'Quote Ready', body: 'Hi {{name}}, your quote is ready! Please check your email for details.' },
  { id: 't3', name: 'Appointment Reminder', body: 'Hi {{name}}, this is a reminder about your appointment tomorrow.' },
]

function formatTimestamp(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)

  if (d >= startOfToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (d >= startOfYesterday) return 'Yesterday'
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

function getChannelIcon(channel) {
  const map = {
    whatsapp: MessageCircle,
    sms: Phone,
    email: Mail,
    instagram: Instagram,
    facebook: Facebook,
  }
  const Icon = map[channel?.toLowerCase()] || MessageSquare
  return <Icon className="w-3 h-3" />
}

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase()
}

function ConversationItem({ conv, isActive, onClick, onEdit, onDelete }) {
  const hasUnread = (conv.unreadCount || 0) > 0

  return (
    <div
      className={cn(
        'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 transition-colors hover:bg-accent/50 group relative cursor-pointer',
        isActive && 'bg-accent'
      )}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
            {getInitials(conv.leadName)}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={cn('text-sm truncate', hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
            {conv.leadName || 'Unknown Lead'}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatTimestamp(conv.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-muted-foreground">{getChannelIcon(conv.channel)}</span>
          <TemperatureBadge temperature={conv.temperature} className="text-[10px] py-0 px-1.5" />
        </div>

        <p className={cn(
          'text-xs truncate',
          hasUnread ? 'text-foreground/70 font-medium' : 'text-muted-foreground'
        )}>
          {conv.lastMessage || 'No messages yet'}
        </p>
      </div>

      {hasUnread && (
        <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
        </span>
      )}

      {/* Edit / Delete Dropdown */}
      <div 
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()} // Prevent triggering onClick of the conversation item
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(conv)}>
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              Edit Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(conv)} className="text-red-500 hover:text-red-600 focus:text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function getStatusTicks(status) {
  if (status === 'sent') {
    return <Check className="w-3.5 h-3.5 text-indigo-200/70 inline-block" />
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3.5 h-3.5 text-indigo-200/70 inline-block" />
  }
  if (status === 'read') {
    return <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline-block" />
  }
  return null
}

function MessageBubble({ message }) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn('flex gap-2 max-w-[75%]', isOutbound ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {!isOutbound && (
        <Avatar className="w-7 h-7 flex-shrink-0 mt-auto">
          <AvatarFallback className="bg-slate-500 text-white text-[10px]">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'rounded-2xl px-3.5 py-2 text-sm shadow-sm',
        isOutbound
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-card border border-border text-foreground rounded-tl-sm'
      )}>
        {message.body || message.content || message.text}
        <div className={cn(
          'text-[10px] mt-1 text-right flex items-center justify-end gap-1',
          isOutbound ? 'text-indigo-200' : 'text-muted-foreground'
        )}>
          {formatTimestamp(message.createdAt || message.timestamp)}
          {message.channel && (
            <span className="opacity-70">{getChannelIcon(message.channel)}</span>
          )}
          {isOutbound && getStatusTicks(message.deliveryStatus)}
        </div>
      </div>
    </div>
  )
}

function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 opacity-40" />
      </div>
      <p className="text-base font-medium text-foreground/60">Select a conversation</p>
      <p className="text-sm mt-1 opacity-70">Choose a lead from the sidebar to view their messages</p>
    </div>
  )
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'flex-row-reverse ml-auto max-w-[60%]' : 'max-w-[60%]')}>
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <Skeleton className="h-12 flex-1 rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

export default function InboxPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [selectedConv, setSelectedConv] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [localMessages, setLocalMessages] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { toast } = useToast()

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId) => {
      const { deleteLeadApi } = await import('@/api/leads.api')
      return deleteLeadApi(leadId)
    },
    onSuccess: () => {
      toast({ title: 'Contact deleted successfully' })
      setSelectedConv(null)
      queryClient.invalidateQueries(['inbox'])
      queryClient.invalidateQueries(['leads'])
    }
  })

  const handleDeleteConversation = (conv) => {
    if (window.confirm(`Are you sure you want to delete the contact ${conv.leadName}? This will remove them completely.`)) {
      deleteLeadMutation.mutate(conv.leadId || conv._id)
    }
  }

  const handleEditConversation = (conv) => {
    // Navigate to Leads page edit modal, or just show a message for now
    toast({ 
      title: 'To edit this contact:', 
      description: 'Please go to the Leads page in the left menu and edit their phone number there.',
      duration: 5000
    })
  }

  const { data: inboxData, isLoading: inboxLoading } = useQuery({
    queryKey: ['inbox', search, channelFilter],
    queryFn: async () => {
      const params = {
        ...(search && { search }),
        ...(channelFilter && { channel: channelFilter }),
      }
      const res = await getInboxApi(params)
      return res.data?.data || res.data || []
    },
    refetchInterval: 30000,
  })

  const rawConversations = Array.isArray(inboxData)
    ? inboxData
    : (inboxData?.inbox || inboxData?.conversations || inboxData?.leads || [])

  const conversations = (rawConversations || []).map(conv => {
    if (!conv) return null;
    return {
      ...conv,
      leadName: conv.leadName || conv.lead?.contact?.name || 'Unknown Lead',
      lastMessageAt: conv.lastMessage?.createdAt || conv.lastMessageAt,
      channel: conv.lastMessage?.channel || conv.channel || 'whatsapp',
      temperature: conv.lead?.temperature || conv.temperature,
      lastMessage: typeof conv.lastMessage === 'object' ? conv.lastMessage?.content : (conv.lastMessage || 'No messages yet')
    };
  }).filter(Boolean);

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations', selectedConv?.leadId],
    queryFn: async () => {
      const res = await getConversationsApi(selectedConv.leadId, { limit: 100 })
      return res.data?.data || res.data || []
    },
    enabled: !!selectedConv?.leadId,
    onSuccess: () => {
      if (selectedConv?.leadId) {
        markConversationReadApi(selectedConv.leadId).catch(() => {})
        queryClient.invalidateQueries(['inbox'])
      }
    },
  })

  useEffect(() => {
    if (convData) {
      const msgs = Array.isArray(convData)
        ? convData
        : (convData?.messages || convData?.conversations || [])
      // Reverse the array so the oldest is at the top, newest at the bottom
      setLocalMessages([...msgs].reverse())
    }
  }, [convData])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [localMessages])

  useEffect(() => {
    const handleMessageReceived = (payload) => {
      const { leadId, message } = payload || {}
      if (!leadId || !message) return

      queryClient.invalidateQueries(['inbox'])

      if (selectedConv?.leadId === leadId) {
        setLocalMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id)
          if (exists) return prev
          return [...prev, message]
        })
      }
    }

    const handleMessageStatus = (payload) => {
      const { leadId, messageId, status } = payload || {}
      if (!leadId || !messageId || !status) return

      if (selectedConv?.leadId === leadId) {
        setLocalMessages((prev) =>
          prev.map((msg) => {
            if (String(msg._id) === String(messageId)) {
              return { ...msg, deliveryStatus: status }
            }
            return msg
          })
        )
      }
    }

    socket.on('message:received', handleMessageReceived)
    socket.on('message:status', handleMessageStatus)
    return () => {
      socket.off('message:received', handleMessageReceived)
      socket.off('message:status', handleMessageStatus)
    }
  }, [selectedConv?.leadId, queryClient])

  const sendMutation = useMutation({
    mutationFn: ({ leadId, data }) => sendMessageApi(leadId, data),
    onMutate: ({ data }) => {
      const optimistic = {
        _id: `optimistic-${Date.now()}`,
        body: data.body || data.text || data.message,
        direction: 'outbound',
        createdAt: new Date().toISOString(),
        channel: selectedConv?.channel,
        pending: true,
      }
      setLocalMessages((prev) => [...prev, optimistic])
    },
    onSuccess: (res) => {
      const saved = res.data?.data?.message || res.data?.message
      if (saved) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.pending ? saved : m))
        )
      }
      queryClient.invalidateQueries(['inbox'])
    },
    onError: () => {
      setLocalMessages((prev) => prev.filter((m) => !m.pending))
    },
  })

  const templateMutation = useMutation({
    mutationFn: ({ leadId, data }) => sendTemplateApi(leadId, data),
    onSuccess: (res) => {
      const saved = res.data?.data?.message || res.data?.message
      if (saved) {
        setLocalMessages((prev) => [...prev, saved])
      }
      queryClient.invalidateQueries(['inbox'])
    },
  })

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConv(conv)
    setLocalMessages([])
    setMessageText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = () => {
    const text = messageText.trim()
    if (!text || !selectedConv?.leadId) return
    sendMutation.mutate({
      leadId: selectedConv.leadId,
      data: { body: text, channel: selectedConv.channel || 'whatsapp' },
    })
    setMessageText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSendTemplate = (template) => {
    if (!selectedConv?.leadId) return
    templateMutation.mutate({
      leadId: selectedConv.leadId,
      data: { templateId: template.id, name: template.name },
    })
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true
    return (c.leadName || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-6 -my-6">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground mb-3">Inbox</h1>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Channel filter */}
          <div className="flex gap-2 flex-wrap pb-2 border-b border-border mb-2 px-1">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              const isActive = channelFilter === ch.value
              return (
                <button
                  key={ch.value}
                  onClick={() => setChannelFilter(ch.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl border transition-all',
                    isActive
                      ? cn(ch.activeBg, 'border-transparent shadow-sm text-white')
                      : 'bg-background border-border hover:bg-accent/50 text-muted-foreground'
                  )}
                >
                  <Icon className={cn("w-6 h-6", !isActive && ch.inactiveIcon)} />
                  <span className="text-[10px] font-medium leading-none">{ch.label}</span>
                </button>
              )
            })}
          </div>

          {/* New Chat Modal */}
          <NewChatModal onChatCreated={handleSelectConversation} />
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {inboxLoading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-3 border-b border-border/50 flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.leadId || conv._id}
                conv={conv}
                isActive={selectedConv?.leadId === (conv.leadId || conv._id)}
                onClick={() =>
                  handleSelectConversation({
                    ...conv,
                    leadId: conv.leadId || conv._id,
                  })
                }
                onEdit={handleEditConversation}
                onDelete={handleDeleteConversation}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {!selectedConv ? (
          <EmptyConversationState />
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
                  {getInitials(selectedConv.leadName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {selectedConv.leadName || 'Unknown Lead'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {getChannelIcon(selectedConv.channel)}
                    <span className="capitalize">{selectedConv.channel || 'Chat'}</span>
                  </span>
                  {selectedConv.temperature && (
                    <TemperatureBadge temperature={selectedConv.temperature} className="text-[10px] py-0 px-1.5" />
                  )}
                </div>
              </div>
              {selectedConv.phone && (
                <span className="text-xs text-muted-foreground hidden sm:block">{selectedConv.phone}</span>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              {convLoading ? (
                <MessageSkeleton />
              ) : localMessages.filter(m => !channelFilter || m.channel === channelFilter).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localMessages
                    .filter(msg => !channelFilter || msg.channel === channelFilter)
                    .map((msg, idx) => (
                      <MessageBubble key={msg._id || idx} message={msg} />
                    ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    className={cn(
                      'w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm',
                      'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                      'transition-colors min-h-[40px] max-h-32'
                    )}
                    style={{ fieldSizing: 'content' }}
                  />
                </div>

                {/* Template button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      title="Send template"
                      disabled={!selectedConv}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {SAMPLE_TEMPLATES.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => handleSendTemplate(t)}
                        className="flex flex-col items-start gap-0.5 cursor-pointer"
                      >
                        <span className="font-medium text-xs">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2">{t.body}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Send button */}
                <Button
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMutation.isPending}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
