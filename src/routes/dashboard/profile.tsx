import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../hooks/useAuth'
import { showToast } from '../../components/ui/Toast'
import { Save } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/dashboard/profile')({ component: ProfilePage })

function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const updateProfile = useMutation(api.users.updateProfile)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateProfile({ id: user.id as Id<'users'>, name, phone: phone || undefined })
      showToast('Profile updated!', 'success')
    } catch {
      showToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="page-wrap max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm no-underline transition-colors">← Dashboard</Link>
          <span className="text-[var(--border)]">/</span>
          <h1 className="text-2xl font-bold text-[var(--text)]">My Profile</h1>
        </div>

        <div className="card p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--gold)', color: '#000' }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-[var(--text)]">{user?.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
              <span className="badge badge-gold mt-1">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Phone number</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 6900 000000" type="tel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
              <input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
              <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary gap-2">
              <Save size={15} />{saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
