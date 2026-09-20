import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiErrorMessage } from '@/lib/api-client'

export default function PlatformLoginPage() {
  const { loginPlatform } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginPlatform(username.trim(), password)
      navigate('/platform', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-white">Platform Console</span>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-xl p-6">
          <h1 className="text-lg font-semibold text-ink-900">Platform admin sign in</h1>
          <p className="text-sm text-ink-500 mt-1 mb-6">Manage hospital onboarding and tenant access.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <Input id="username" className="pl-8" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <Input id="password" type="password" className="pl-8" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
        </div>

        <p className="text-xs text-ink-400 mt-6 text-center">
          Looking for a hospital login instead? <a href="/login" className="underline hover:text-white">Go there</a>
        </p>
      </div>
    </div>
  )
}