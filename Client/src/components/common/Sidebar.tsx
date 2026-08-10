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
    navigate('/')
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        id="sidebar-toggle"
        className="fixed top-3 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-[var(--border)] text-[var(--ink)] lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn('sidebar', mobileOpen && 'sidebar-open')}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-mark">TM</div>
          {/* <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">TMS Portal</span>
            <span className="sidebar-brand-sub">Ticket Management</span>
          </div> */}
          {/* Mobile close */}
          <button
            type="button"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section label */}
        <p className="sidebar-section-label">{title}</p>

        {/* Nav items */}
        <nav className="sidebar-nav" aria-label={`${title} navigation`}>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active')
                }
              >
                <Icon size={18} className="sidebar-link-icon" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar" aria-hidden>
              {getInitials(user?.name)}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.name ?? 'User'}</p>
              <p className="sidebar-user-role">{user?.role ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
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

// Mobile bottom nav for small screens as a horizontal pill nav
export function MobileNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('mobile-nav-link', isActive && 'active')
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
