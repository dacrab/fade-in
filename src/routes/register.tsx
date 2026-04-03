import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import { useAuth, type UserRole } from '../hooks/useAuth'
import { showToast } from '../components/ui/Toast'

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { showToast('Please fill in all fields', 'error'); return }
    if (password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return }
    setLoading(true)
    try {
      await register(email, password, name, role)
      showToast('Account created! Welcome to FadeIn 🎉', 'success')
      router.navigate({ to: role === 'owner' ? '/business' : '/dashboard' })
    } catch (err: any) {
      showToast(err?.message ?? 'Registration failed. Please try again.', 'error')
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
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)]">Join FadeIn today — it's free</p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Role selector */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)] mb-5">
            {(['customer', 'owner'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: role === r ? 'var(--gold)' : 'var(--bg-card)',
                  color: role === r ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {r === 'customer' ? '✂️ Customer' : '🏪 Shop Owner'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Full name</label>
              <input
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-[var(--text-subtle)]">
            By signing up you agree to our{' '}
            <a href="/terms" className="text-[var(--gold)] hover:underline">Terms</a>
            {' & '}
            <a href="/privacy" className="text-[var(--gold)] hover:underline">Privacy Policy</a>
          </p>

          <div className="mt-4 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--gold)] hover:underline no-underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
