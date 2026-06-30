import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Kanban,
  CheckSquare,
  Calendar,
  FileText,
  Wrench,
  BarChart2,
  Settings,
  UserCog,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/theme/ThemeProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const NAV_MAIN = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Leads',     icon: Users,           to: '/leads' },
  { label: 'Inbox',     icon: MessageSquare,   to: '/inbox' },
  { label: 'Pipeline',  icon: Kanban,          to: '/pipeline' },
  { label: 'Tasks',     icon: CheckSquare,     to: '/tasks' },
  { label: 'Follow-ups',icon: Calendar,        to: '/followups' },
  { label: 'Quotations',icon: FileText,        to: '/quotations' },
  { label: 'Installations', icon: Wrench,      to: '/installations' },
  { label: 'Reports',   icon: BarChart2,       to: '/reports' },
]

const NAV_SYSTEM = [
  { label: 'Settings',  icon: Settings,        to: '/settings' },
  { label: 'Users',     icon: UserCog,         to: '/users',  permission: 'users:read' },
  { label: 'Roles',     icon: Shield,          to: '/roles',  permission: 'roles:read' },
]

function NavItem({ item, collapsed }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && <span className="truncate leading-none">{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onCollapsedChange, isOpen, onClose }) {
  const { user, logout, hasPermission } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const visibleSystem = NAV_SYSTEM.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User'
    : 'User'

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col bg-slate-900 border-r border-slate-800',
          'transition-[width,transform] duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo row */}
        <div className={cn(
          'flex flex-row items-center h-16 border-b border-slate-800 flex-shrink-0 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <div className="flex flex-row items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight">SalesNest</p>
                <p className="text-slate-500 text-[11px]">AI CRM</p>
              </div>
            )}
          </div>

          {/* Collapse toggle — desktop */}
          {!collapsed && (
            <button
              onClick={() => onCollapsedChange(true)}
              className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Close button — mobile */}
          <button
            onClick={onClose}
            className="lg:hidden flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expand handle when collapsed (desktop) */}
        {collapsed && (
          <button
            onClick={() => onCollapsedChange(false)}
            className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 bg-slate-700 border border-slate-600 rounded-full items-center justify-center text-slate-300 hover:text-white z-10"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                Main
              </p>
            )}
            {NAV_MAIN.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="space-y-0.5">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                System
              </p>
            )}
            {visibleSystem.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-2 py-3 flex-shrink-0 space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'flex flex-row items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400',
              'hover:bg-white/5 hover:text-slate-100 transition-colors text-sm',
              collapsed && 'justify-center px-2'
            )}
          >
            {theme === 'dark'
              ? <Sun className="w-[18px] h-[18px] flex-shrink-0" />
              : <Moon className="w-[18px] h-[18px] flex-shrink-0" />
            }
            {!collapsed && (
              <span className="leading-none">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* User row */}
          <div className={cn(
            'flex flex-row items-center gap-2.5 px-3 py-2 rounded-lg',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            <div className="flex flex-row items-center gap-2.5 min-w-0">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate leading-tight">
                    {user?.role?.name ?? 'Admin'}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={logout}
              className="flex flex-row items-center justify-center w-full py-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              title="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
