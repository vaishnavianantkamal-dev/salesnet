import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { socket } from '@/app/socket'
import { useToast } from '@/hooks/useToast'
import GlobalLeadModal from '@/components/GlobalLeadModal'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleNewLead = (lead) => {
      toast({
        title: 'New Lead Arrived!',
        description: `${lead.contact?.name || lead.contact?.phone} just submitted their info.`,
      })
    }

    socket.on('new_lead', handleNewLead)

    return () => {
      socket.off('new_lead', handleNewLead)
    }
  }, [toast])

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      {/* Main content — shifts right based on sidebar width */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out',
        'lg:ml-64',
        collapsed && 'lg:ml-16'
      )}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster />
      <GlobalLeadModal />
    </div>
  )
}
