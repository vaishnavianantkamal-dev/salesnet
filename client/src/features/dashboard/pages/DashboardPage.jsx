import { useAuth } from '@/hooks/useAuth'
import AdminDashboard from '../components/AdminDashboard'
import SalesDashboard from '../components/SalesDashboard'
import InstallDashboard from '../components/InstallDashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  const roleKey = user?.role?.key || user?.role || 'sales_executive'

  if (roleKey === 'super_admin' || roleKey === 'admin') {
    return <AdminDashboard />
  }

  if (roleKey === 'installation_executive' || roleKey === 'installer') {
    return <InstallDashboard />
  }

  // Default: sales executive
  return <SalesDashboard />
}
