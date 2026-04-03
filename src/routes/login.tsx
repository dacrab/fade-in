import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { showToast } from '../components/ui/Toast'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { showToast('Please fill in all fields', 'error'); return }
    setLoading(true)
    try {
      await login(email, password)
      showToast('Welcome back!', 'success')
      router.navigate({ to: '/dashboard' })
    } catch (err: any) {
      showToast(err?.message ?? 'Sign in failed. Check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))' }}>
              <Scissors size={20} color="#000" />
            </div>
            <span className="text-2xl font-bold text-[var(--text)]">Fade<span className="gold-text">In</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in to your FadeIn account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--gold)] hover:underline no-underline font-semibold">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
