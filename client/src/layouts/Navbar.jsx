import { useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/theme/ThemeProvider'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import NotificationPanel from '@/features/notifications/components/NotificationPanel'
import { getUnreadCountApi } from '@/api/notifications.api'

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/inbox': 'Inbox',
  '/pipeline': 'Pipeline',
  '/tasks': 'Tasks',
  '/followups': 'Follow-ups',
  '/quotations': 'Quotations',
  '/installations': 'Installations',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'User Management',
  '/roles': 'Role Management',
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)

  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const res = await getUnreadCountApi()
      return res.data
    },
    staleTime: 55 * 1000,
    refetchInterval: 60 * 1000,
  })

  const unreadCount = unreadData?.data?.count ?? unreadData?.count ?? 0

  const handleBellClick = useCallback(() => {
    setNotificationPanelOpen((prev) => !prev)
  }, [])

  const handlePanelClose = useCallback(() => {
    setNotificationPanelOpen(false)
    refetchUnread()
  }, [refetchUnread])

  const pageTitle = routeTitles[location.pathname] || 'SalesNest'

  return (
    <>
    <header className="h-16 bg-background border-b border-border flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-shrink-0">
        <h1 className="text-base font-semibold text-foreground hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center w-64 lg:w-80 relative">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search leads, contacts..."
          className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          onClick={handleBellClick}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-accent transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User' || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User' || 'User'}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user?.role?.name || 'Admin'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User'}</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <NotificationPanel
      isOpen={notificationPanelOpen}
      onClose={handlePanelClose}
    />
    </>
  )
}
