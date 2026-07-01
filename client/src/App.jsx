import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './routes/ProtectedRoute'

import LoginPage from './features/auth/pages/LoginPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'

const UsersPage = lazy(() => import('./features/users/pages/UsersPage'))
const RolesPage = lazy(() => import('./features/roles/pages/RolesPage'))
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'))
const LeadsPage = lazy(() => import('./features/leads/pages/LeadsPage'))
const LeadDetailPage = lazy(() => import('./features/leads/pages/LeadDetailPage'))
const Lead360Page = lazy(() => import('./features/lead360/pages/Lead360Page'))
const InboxPage = lazy(() => import('./features/inbox/pages/InboxPage'))
const PipelinePage = lazy(() => import('./features/pipeline/pages/PipelinePage'))
const TasksPage = lazy(() => import('./features/tasks/pages/TasksPage'))
const FollowupsPage = lazy(() => import('./features/followups/pages/FollowupsPage'))
const QuotationsPage = lazy(() => import('./features/quotations/pages/QuotationsPage'))
const QuotationDetailPage = lazy(() => import('./features/quotations/pages/QuotationDetailPage'))
const ProductsPage = lazy(() => import('./features/products/pages/ProductsPage'))
const InstallationsPage = lazy(() => import('./features/installations/pages/InstallationsPage'))
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={
            <div className="text-center space-y-4 p-8">
              <h2 className="text-2xl font-bold">Forgot Password</h2>
              <p className="text-muted-foreground">Contact your administrator to reset your password.</p>
            </div>
          } />
        </Route>

        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/leads" element={<ProtectedRoute requiredPermission="leads:read"><LeadsPage /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute requiredPermission="leads:read"><LeadDetailPage /></ProtectedRoute>} />

          <Route path="/lead360" element={<ProtectedRoute requiredPermission="leads:read"><Lead360Page /></ProtectedRoute>} />

          <Route path="/inbox" element={<ProtectedRoute requiredPermission="conversations:read"><InboxPage /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute requiredPermission="leads:read"><PipelinePage /></ProtectedRoute>} />

          <Route path="/tasks" element={<ProtectedRoute requiredPermission="tasks:read"><TasksPage /></ProtectedRoute>} />
          <Route path="/followups" element={<ProtectedRoute requiredPermission="followups:read"><FollowupsPage /></ProtectedRoute>} />

          <Route path="/quotations" element={<ProtectedRoute requiredPermission="leads:read"><QuotationsPage /></ProtectedRoute>} />
          <Route path="/quotations/:id" element={<ProtectedRoute requiredPermission="leads:read"><QuotationDetailPage /></ProtectedRoute>} />

          <Route path="/products" element={<ProtectedRoute requiredPermission="leads:read"><ProductsPage /></ProtectedRoute>} />

          <Route path="/installations" element={<ProtectedRoute requiredPermission="installations:read"><InstallationsPage /></ProtectedRoute>} />

          <Route path="/reports" element={<ProtectedRoute requiredPermission="reports:view"><ReportsPage /></ProtectedRoute>} />

          <Route path="/users" element={<ProtectedRoute requiredPermission="users:read"><UsersPage /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute requiredPermission="roles:read"><RolesPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
