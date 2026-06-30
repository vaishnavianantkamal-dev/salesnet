import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Moon, Sun, User, Shield, Info, Plug, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/theme/ThemeProvider'
import { selectUser } from '@/features/auth/authSlice'
import { changePasswordApi } from '@/api/auth.api'
import { useToast } from '@/hooks/useToast'
import {
  getIntegrationsApi, upsertIntegrationApi,
  toggleIntegrationApi, testIntegrationApi,
} from '@/api/integrations.api'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'about', label: 'About', icon: Info },
]

// ── Masked input that can toggle reveal ──────────────────────────────────────
function SecretInput({ id, placeholder, value, onChange, disabled }) {
  const [show, setShow] = useState(false)
  const isSaved = value === '***SAVED***'
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={isSaved ? '••••••••  (saved)' : placeholder}
        value={isSaved ? '' : value}
        onChange={onChange}
        disabled={disabled}
        className="pr-10 font-mono text-sm"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ── Single integration card ──────────────────────────────────────────────────
function IntegrationCard({ name, title, description, icon, fields, integration, onSave, onToggle, onTest, isSaving, isTesting }) {
  const config = integration?.config || {}
  const isActive = integration?.isActive || false
  const [localValues, setLocalValues] = useState({})

  const displayConfig = { ...config, ...localValues }

  const handleChange = (key, val) => setLocalValues((p) => ({ ...p, [key]: val }))

  const handleSave = () => {
    const payload = {}
    fields.forEach(({ key }) => {
      if (localValues[key] !== undefined && localValues[key] !== '') {
        payload[key] = localValues[key]
      }
    })
    if (Object.keys(payload).length === 0) return
    onSave(name, payload)
    setLocalValues({})
  }

  const hasChanges = Object.values(localValues).some((v) => v !== '')

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {integration && (
              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggle(name)}
              title={isActive ? 'Disable' : 'Enable'}
            >
              {isActive
                ? <ToggleRight className="w-5 h-5 text-primary" />
                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              }
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(({ key, label, placeholder, secret, readOnly }) => (
            <div key={key}>
              <Label htmlFor={`${name}-${key}`} className="text-xs text-muted-foreground mb-1 block">
                {label}
              </Label>
              {secret ? (
                <SecretInput
                  id={`${name}-${key}`}
                  placeholder={placeholder}
                  value={localValues[key] !== undefined ? localValues[key] : (displayConfig[key] || '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              ) : (
                <Input
                  id={`${name}-${key}`}
                  placeholder={placeholder}
                  value={localValues[key] !== undefined ? localValues[key] : (displayConfig[key] === '***SAVED***' ? '' : displayConfig[key] || '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                  readOnly={readOnly}
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onTest(name)}
            disabled={isTesting || !integration}
          >
            {isTesting ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Testing...</>
            ) : 'Test Connection'}
          </Button>
          <Button
            size="sm"
            className="text-xs h-7"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Saving...</>
            ) : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Integration definitions ──────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    name: 'meta_whatsapp',
    title: 'Meta WhatsApp (Cloud API)',
    description: 'WhatsApp Business Cloud API for messaging & lead capture',
    icon: '💬',
    fields: [
      { key: 'appSecret', label: 'App Secret', placeholder: 'Meta App Secret', secret: true },
      { key: 'verifyToken', label: 'Webhook Verify Token', placeholder: 'salesnest_webhook_verify' },
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: 'WA Phone Number ID' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'WA Permanent Access Token', secret: true },
      { key: 'businessAccountId', label: 'Business Account ID', placeholder: 'WA Business Account ID' },
    ],
  },
  {
    name: 'google_leads',
    title: 'Google Lead Form Ads',
    description: 'Receive leads from Google Ads lead form extensions',
    icon: '🔍',
    fields: [
      { key: 'leadKey', label: 'Webhook Secret Key', placeholder: 'Google Lead Webhook Key', secret: true },
    ],
  },
  {
    name: 'indiamart',
    title: 'IndiaMART',
    description: 'Pull leads from IndiaMART CRM Lead Manager API',
    icon: '🏭',
    fields: [
      { key: 'crmKey', label: 'CRM Key', placeholder: 'IndiaMART CRM API Key', secret: true },
    ],
  },
  {
    name: 'tradeindia',
    title: 'TradeIndia',
    description: 'Import leads from TradeIndia Business Portal',
    icon: '🤝',
    fields: [
      { key: 'userId', label: 'User ID', placeholder: 'TradeIndia User ID' },
      { key: 'key', label: 'API Key', placeholder: 'TradeIndia API Key', secret: true },
      { key: 'profileId', label: 'Profile ID', placeholder: 'TradeIndia Profile ID' },
    ],
  },
  {
    name: 'justdial',
    title: 'JustDial',
    description: 'Receive inbound leads from JustDial webhook',
    icon: '📞',
    fields: [
      { key: 'token', label: 'Webhook Token', placeholder: 'JustDial Webhook Token', secret: true },
    ],
  },
  {
    name: 'aws_s3',
    title: 'AWS S3',
    description: 'Cloud storage for installation images, signatures, and documents',
    icon: '☁️',
    fields: [
      { key: 'bucket', label: 'Bucket Name', placeholder: 'your-s3-bucket-name' },
      { key: 'accessKeyId', label: 'Access Key ID', placeholder: 'AKIA...', secret: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', placeholder: 'AWS Secret Access Key', secret: true },
      { key: 'region', label: 'Region', placeholder: 'ap-south-1' },
    ],
  },
  {
    name: 'openai',
    title: 'OpenAI',
    description: 'GPT-4 powered AI features — smart replies, lead summaries',
    icon: '🤖',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', secret: true },
    ],
  },
  {
    name: 'gemini',
    title: 'Google Gemini',
    description: 'Gemini AI for content generation and lead insights',
    icon: '✨',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'AIza...', secret: true },
    ],
  },
]

// ── Integrations Tab ─────────────────────────────────────────────────────────
function IntegrationsTab() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [savingName, setSavingName] = useState(null)
  const [testingName, setTestingName] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => getIntegrationsApi().then((r) => r.data?.data?.integrations || r.data?.data || []),
  })

  const integrationMap = (Array.isArray(data) ? data : []).reduce((acc, i) => {
    acc[i.name] = i
    return acc
  }, {})

  const handleSave = async (name, config) => {
    setSavingName(name)
    try {
      await upsertIntegrationApi(name, { config })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({ title: 'Saved', description: `${name.replace(/_/g, ' ')} settings saved.` })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Save failed', variant: 'destructive' })
    } finally {
      setSavingName(null)
    }
  }

  const handleToggle = async (name) => {
    try {
      await toggleIntegrationApi(name)
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Toggle failed', variant: 'destructive' })
    }
  }

  const handleTest = async (name) => {
    setTestingName(name)
    try {
      const res = await testIntegrationApi(name)
      const result = res.data?.data
      if (result?.success) {
        toast({ title: 'Connection successful', description: result.message || 'Integration is working.' })
      } else {
        toast({ title: 'Test result', description: result?.message || 'Manually verify your credentials.', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Test failed', description: err.response?.data?.message || 'Could not connect', variant: 'destructive' })
    } finally {
      setTestingName(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
        <strong className="text-amber-600 dark:text-amber-400">Security note:</strong> Credentials are encrypted at rest. Saved values are masked — enter a new value to update.
      </div>

      {INTEGRATIONS.map((integration) => (
        <IntegrationCard
          key={integration.name}
          {...integration}
          integration={integrationMap[integration.name]}
          onSave={handleSave}
          onToggle={handleToggle}
          onTest={handleTest}
          isSaving={savingName === integration.name}
          isTesting={testingName === integration.name}
        />
      ))}
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const user = useSelector(selectUser)
  const { theme, setTheme, toggleTheme } = useTheme()
  const { toast } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const onChangePassword = async (data) => {
    setIsChangingPassword(true)
    try {
      await changePasswordApi(data.currentPassword, data.newPassword)
      toast({ title: 'Password changed', description: 'Please log in again.', variant: 'default' })
      reset()
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account, integrations, and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="w-full md:w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-row items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-primary mt-1 capitalize">{user?.role?.name}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', value: user?.firstName },
                    { label: 'Last Name', value: user?.lastName },
                    { label: 'Email', value: user?.email },
                    { label: 'Phone', value: user?.phone },
                    { label: 'Role', value: user?.role?.name },
                    { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive', className: user?.isActive ? 'text-green-600' : 'text-red-500' },
                  ].map(({ label, value, className }) => (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <p className={`text-sm font-medium mt-1 capitalize ${className || ''}`}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
                  {[
                    { id: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                    { id: 'newPassword', label: 'New Password', placeholder: 'Minimum 8 characters' },
                    { id: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id}>
                      <Label htmlFor={id}>{label}</Label>
                      <Input
                        id={id}
                        type="password"
                        placeholder={placeholder}
                        className="mt-1"
                        {...register(id)}
                      />
                      {errors[id] && (
                        <p className="text-xs text-destructive mt-1">{errors[id].message}</p>
                      )}
                    </div>
                  ))}
                  <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
                    {isChangingPassword ? 'Saving...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && <IntegrationsTab />}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Color Theme</Label>
                  <p className="text-xs text-muted-foreground mb-3">Select your preferred color scheme</p>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          theme === value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        theme === 'system'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      System
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <Card>
              <CardHeader>
                <CardTitle>About SalesNest AI CRM</CardTitle>
                <CardDescription>System information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Product', value: 'SalesNest AI CRM' },
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Build', value: 'Phase 1–11 Complete' },
                  { label: 'Stack', value: 'MERN + Redis + BullMQ + Socket.io' },
                  { label: 'AI', value: 'OpenAI GPT-4 / Google Gemini' },
                ].map(({ label, value }, i) => (
                  <div key={label}>
                    {i > 0 && <Separator className="my-3" />}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
