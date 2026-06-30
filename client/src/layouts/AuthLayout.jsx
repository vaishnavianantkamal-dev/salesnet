import { Outlet } from 'react-router-dom'
import { CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: 'AI-Powered Pipeline',
    description: 'Intelligent lead scoring and prioritization',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time updates across your entire sales team',
  },
  {
    icon: Zap,
    title: 'Smart Automation',
    description: 'Automate follow-ups and routine tasks',
  },
  {
    icon: CheckCircle2,
    title: 'Complete Visibility',
    description: 'Full pipeline tracking from lead to installation',
  },
]

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              SalesNest
            </span>
          </div>
          <p className="text-indigo-200 text-sm font-medium tracking-wider uppercase">
            AI-Powered CRM
          </p>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Close More Deals,
              <br />
              Faster Than Ever
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              The intelligent CRM built for modern solar and installation businesses.
              Track every lead, automate follow-ups, and never miss an opportunity.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{feature.title}</p>
                    <p className="text-indigo-300 text-xs mt-0.5">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-sm">
            Trusted by 500+ sales teams across India
          </p>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-lg">★</span>
            ))}
            <span className="text-indigo-200 text-sm ml-2">4.9/5 rating</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">SalesNest</span>
        </div>

        <div className="mx-auto w-full max-w-[400px]">
          <Outlet />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2024 SalesNest. All rights reserved.
        </p>
      </div>
    </div>
  )
}
