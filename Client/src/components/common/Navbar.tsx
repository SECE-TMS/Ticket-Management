import { Link, NavLink } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'
import { Button } from './Button'

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={brandTo} className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">TMS</span>
          {!publicMode && (
            <span className="hidden text-xs text-white/60 sm:inline">Ticket Management</span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white',
                  isActive && 'bg-white/10 text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-white/70 sm:inline">{user.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => void dispatch(logout())}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-600"
            >
              Staff Login
            </Link>
          )}
          {items.length > 0 && (
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-white/10 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm text-white/80',
                    isActive && 'bg-white/10 text-white'
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
