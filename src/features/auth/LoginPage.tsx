import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Activity, Building2, User, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiErrorMessage } from '@/lib/api-client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tenantCode, setTenantCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(tenantCode.trim(), username.trim(), password)
      const from = (location.state as { from?: string })?.from || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary-900 text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-700/40 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">HMS Platform</span>
        </div>
        <div className="relative">
          <p className="text-3xl font-semibold leading-tight max-w-sm">
            One system for OPD, IPD, billing and pharmacy — built for how hospitals actually run.
          </p>
          <p className="text-primary-200 mt-4 text-sm max-w-sm">
            Every hospital's data lives in its own isolated schema. Sign in with your hospital's code to get started.
          </p>
        </div>
        <p className="relative text-xs text-primary-300">© {new Date().getFullYear()} HMS Platform</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-semibold">HMS Platform</span>
          </div>

          <h1 className="text-xl font-semibold text-ink-900">Sign in to your hospital</h1>
          <p className="text-sm text-ink-500 mt-1 mb-6">Enter your hospital code and staff credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tenantCode">Hospital code</Label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <Input
                  id="tenantCode" className="pl-8" placeholder="e.g. motherland-noida"
                  value={tenantCode} onChange={(e) => setTenantCode(e.target.value)} required autoFocus
                />
              </div>
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <Input
                  id="username" className="pl-8" placeholder="your username"
                  value={username} onChange={(e) => setUsername(e.target.value)} required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <Input
                  id="password" type="password" className="pl-8" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-danger-50 border border-danger-500/20 px-3 py-2 text-sm text-danger-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-ink-400 mt-6 text-center">
            New hospital? Onboarding is done by your platform administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
