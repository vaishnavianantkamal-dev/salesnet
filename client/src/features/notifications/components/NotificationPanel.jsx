import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Wrench,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getNotificationsApi, markReadApi, markAllReadApi } from '@/api/notifications.api'

const PAGE_SIZE = 15

const TYPE_CONFIG = {
  info: { icon: Info, className: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  warning: { icon: AlertTriangle, className: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  success: { icon: CheckCircle2, className: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  error: { icon: XCircle, className: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  lead: { icon: Bell, className: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30' },
  task: { icon: Calendar, className: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  payment: { icon: DollarSign, className: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
  installation: { icon: Wrench, className: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30' },
  message: { icon: MessageSquare, className: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
}

function NotificationIcon({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info
  const Icon = config.icon
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.className)}>
      <Icon className="w-4 h-4" />
    </div>
  )
}

function NotificationItem({ notification, onMarkRead }) {
  const isUnread = !notification.isRead && !notification.read

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group',
        isUnread && 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={() => isUnread && onMarkRead(notification._id)}
    >
      <NotificationIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" aria-label="Unread" />
          )}
        </div>
        {notification.body || notification.message ? (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body || notification.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {notification.createdAt
            ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
            : 'Just now'}
        </p>
      </div>
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

export default function NotificationPanel({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const bottomRef = useRef(null)
  const panelRef = useRef(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getNotificationsApi({ page: pageParam, limit: PAGE_SIZE })
      return res.data
    },
    getNextPageParam: (lastPage, pages) => {
      const meta = lastPage?.data?.meta || lastPage?.meta
      const total = meta?.total || 0
      const fetched = pages.reduce((s, p) => s + ((p?.data?.notifications || p?.data || []).length), 0)
      return fetched < total ? pages.length + 1 : undefined
    },
    enabled: isOpen,
    staleTime: 30 * 1000,
  })

  const markReadMutation = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications-unread-count'])
    },
  })

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!bottomRef.current || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage()
      },
      { threshold: 0.1 }
    )
    observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const allNotifications = (data?.pages || []).flatMap(
    (p) => p?.data?.notifications || p?.data || []
  )
  const hasUnread = allNotifications.some((n) => !n.isRead && !n.read)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-4 top-[4.5rem] z-50 w-[380px] max-w-[calc(100vw-2rem)]',
          'bg-background border border-border rounded-xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-top-2 duration-200'
        )}
        style={{ maxHeight: 'calc(100vh - 6rem)' }}
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array(5).fill(0).map((_, i) => <NotificationSkeleton key={i} />)}
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">All caught up</p>
                <p className="text-sm text-muted-foreground mt-1">You have no notifications right now</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allNotifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={bottomRef} className="py-2 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {!hasNextPage && allNotifications.length > 0 && (
                  <p className="text-xs text-muted-foreground/60 py-1">No more notifications</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}
