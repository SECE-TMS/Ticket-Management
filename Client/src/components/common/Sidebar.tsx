import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'

export interface SidebarItem {
  to: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  items: SidebarItem[]
  title: string
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Sidebar({ items, title }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    void dispatch(logout())
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* Mobile Top Header (Visible ONLY on mobile < lg) */}
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--white)] px-4 shadow-xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer hover:bg-[var(--primary-blue-light)] hover:text-[var(--primary-blue)] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary-blue)] text-[var(--gold)] font-bold text-xs">
              TM
            </div>
            <span className="font-bold text-sm text-[var(--ink)]">TMS Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--primary-blue-deeper)] text-xs font-bold uppercase">
            {getInitials(user?.name)}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Full-Height Desktop Sidebar & Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 flex w-[260px] min-h-screen flex-col shrink-0 transition-transform duration-300 lg:z-30 lg:translate-x-0',
          'bg-gradient-to-b from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] shadow-xl lg:shadow-none text-[var(--white)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold)] text-[var(--primary-blue-deeper)] font-bold text-sm shrink-0 shadow-xs">
            TM
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-[var(--white)] leading-tight tracking-tight">
              TMS Portal
            </span>
            <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Ticket Management
            </span>
          </div>
          <button
            type="button"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white lg:hidden cursor-pointer"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section title */}
        <p className="px-5 pt-5 pb-2 text-[11px] font-semibold text-white/40 uppercase tracking-widest">
          {title} Navigation
        </p>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-1" aria-label={`${title} navigation`}>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 border-l-3 border-transparent',
                    'hover:bg-white/10 hover:text-[var(--white)]',
                    isActive &&
                      'bg-white/14 text-[var(--white)] border-l-[var(--gold)] shadow-xs'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive ? 'text-[var(--gold)]' : 'text-white/70'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-xl bg-white/6 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--primary-blue-deeper)] text-xs font-bold uppercase shrink-0 shadow-xs">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[var(--white)]">
                {user?.name ?? 'User'}
              </p>
              <p className="text-[11px] capitalize text-white/50 font-medium">
                {user?.role ?? ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-[var(--white)] transition-colors cursor-pointer"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto bg-[var(--white)] px-4 py-2.5 border-b border-[var(--border)] lg:hidden no-scrollbar">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border',
                isActive
                  ? 'bg-[var(--primary-blue)] text-[var(--white)] border-[var(--primary-blue)] shadow-xs'
                  : 'bg-transparent text-[var(--ink-muted)] border-transparent hover:bg-[var(--primary-blue-light)] hover:text-[var(--primary-blue)]'
              )
            }
          >
            <Icon size={14} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
