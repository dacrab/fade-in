import { Link } from '@tanstack/react-router'
import { Scissors, Instagram, Facebook, Globe } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[var(--border)] px-4 pt-12 pb-8 mt-20">
      <div className="page-wrap">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))' }}>
                <Scissors size={16} color="#000" />
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>Fade<span className="gold-text">In</span></span>
            </Link>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              The modern platform for discovering and booking top barbershops near you.
            </p>
          </div>
          {/* Discover */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Discover</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[['Barbershops', '/barbershops'], ['For Business', '/for-business']].map(([label, href]) => (
                <li key={label}>
                  <Link to={href as any} className="text-sm no-underline hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--text-muted)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Account</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[['Sign in', '/login'], ['Create account', '/register'], ['Business login', '/login']].map(([label, href]) => (
                <li key={label}>
                  <Link to={href as any} className="text-sm no-underline hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--text-muted)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Company</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-sm no-underline hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--text-muted)' }}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <hr className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
            &copy; {year} FadeIn. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {[Instagram, Facebook, Globe].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-card)]" style={{ color: 'var(--text-muted)' }}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
