import { Link, NavLink } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'

interface NavItem {
  to: string
  label: string
}

interface NavbarProps {
  items?: NavItem[]
  brandTo?: string
  publicMode?: boolean
}

export function Navbar({ items = [], brandTo = '/', publicMode }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()

  return (
    <header
      id="public-navbar"
      className="sticky top-0 z-40"
      style={{ background: 'var(--primary-blue)', boxShadow: '0 2px 12px rgb(35 94 170 / 0.3)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to={brandTo} className="flex items-center gap-2.5 group">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition group-hover:scale-105"
            style={{ background: 'var(--gold)', color: 'var(--primary-blue-deeper)' }}
          >
            TM
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            TMS
            {!publicMode && (
              <span className="ml-1.5 hidden text-xs font-normal text-white/60 sm:inline">
                Ticket Management
              </span>
            )}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-white/70 sm:inline">{user.name}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                onClick={() => void dispatch(logout())}
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition"
              style={{ background: 'var(--gold)', color: 'var(--primary-blue-deeper)' }}
            >
              Staff Login
            </Link>
          )}

          {items.length > 0 && (
            <button
              type="button"
              className="rounded-lg p-2 text-white/75 hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="border-t border-white/10 px-4 py-3 md:hidden"
          style={{ background: 'var(--primary-blue-dark)' }}
        >
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

// ─── Authenticated Top Bar ─────────────────────────────────────────────────
interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()

  function getInitials(name?: string) {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  }

  return (
    <header className="topbar" id="authenticated-topbar">
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile hamburger spacer (the button is rendered in Sidebar) */}
        <div className="w-9 lg:hidden" aria-hidden />

        {title && (
          <p className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
            {title}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {user.name}
              </span>
              <span
                className="text-xs capitalize"
                style={{ color: 'var(--ink-muted)' }}
              >
                {user.role}
              </span>
            </div>
            <div
              className="sidebar-avatar"
              style={{
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                width: '2rem',
                height: '2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getInitials(user.name)}
            </div>
            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--surface-2)] sm:inline-flex"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
              onClick={() => void dispatch(logout())}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
