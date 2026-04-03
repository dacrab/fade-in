import { Link, useRouter } from '@tanstack/react-router'
import { Scissors, Menu as MenuIcon, X, LogOut, LayoutDashboard, Building2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Menu } from './ui/Menu'
import LanguageToggle from "./LanguageToggle"

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.navigate({ to: '/' })
  }

  const userMenuItems = [
    ...(user?.role === 'customer' ? [{
      label: 'My Dashboard',
      icon: <LayoutDashboard size={14} />,
      onClick: () => router.navigate({ to: '/dashboard' }),
    }] : []),
    ...(user?.role === 'owner' ? [{
      label: 'Business Dashboard',
      icon: <Building2 size={14} />,
      onClick: () => router.navigate({ to: '/business' }),
    }] : []),
    ...(user?.role === 'admin' ? [{
      label: 'Admin Panel',
      icon: <ShieldCheck size={14} />,
      onClick: () => router.navigate({ to: '/admin' }),
    }] : []),
    { separator: true, label: '' },
    {
      label: 'Sign out',
      icon: <LogOut size={14} />,
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-lg"
      style={{ background: 'var(--header-bg)' }}
    >
      <nav className="page-wrap px-4 flex items-center gap-4 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))' }}
          >
            <Scissors size={16} color="#000" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Fade<span className="gold-text">In</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>Home</Link>
          <Link to="/barbershops" className="nav-link" activeProps={{ className: 'nav-link active' }}>Barbershops</Link>
          <Link to="/for-business" className="nav-link" activeProps={{ className: 'nav-link active' }}>For Business</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <Menu
              align="end"
              trigger={
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors text-sm"
                  style={{ background: 'var(--bg-card)', cursor: 'pointer' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--gold)', color: '#000' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-[var(--text)]">{user.name}</span>
                </button>
              }
              items={userMenuItems}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost text-sm px-4 py-2">Sign in</Link>
              <Link to="/register" className="btn btn-primary text-sm px-4 py-2">Get started</Link>
            </div>
          )}

          <LanguageToggle />

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-[var(--border)] px-4 py-4 flex flex-col gap-2"
          style={{ background: 'var(--bg-card)' }}
        >
          <Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/barbershops" className="nav-link" onClick={() => setMobileOpen(false)}>Barbershops</Link>
          <Link to="/for-business" className="nav-link" onClick={() => setMobileOpen(false)}>For Business</Link>
          {user ? (
            <>
              <hr className="divider my-1" />
              {user.role === 'customer' && (
                <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              )}
              {user.role === 'owner' && (
                <Link to="/business" className="nav-link" onClick={() => setMobileOpen(false)}>Business</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>Admin</Link>
              )}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="nav-link text-left text-[var(--error)]"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <hr className="divider my-1" />
              <Link to="/login" className="nav-link" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn btn-primary justify-center mt-1" onClick={() => setMobileOpen(false)}>
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
