import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { cn } from '../../lib/utils'
import isaiiCleanLogo from '../../assets/isaii_clean.png'
import sriEshwarCleanLogo from '../../assets/sri_eshwar_clean.png'

export interface NavItem {
  to: string
  label: string
  icon?: LucideIcon
}

interface NavbarProps {
  items?: NavItem[]
  brandTo?: string
  publicMode?: boolean
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

export function Navbar({ items = [], brandTo = '/' }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    void dispatch(logout())
    setOpen(false)
    navigate('/')
  }

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 bg-[var(--primary-blue)] text-[var(--white)] shadow-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        {/* Brand Logo - Split into two separate elements */}
        <Link to={brandTo} className="flex items-center gap-1.5 sm:gap-3 group min-w-0">
          {/* College Logo Badge */}
          <div className="flex items-center rounded-xl bg-white px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm border border-white/30 transition-transform group-hover:scale-105 shrink-0">
            <img
              src={sriEshwarCleanLogo}
              alt="Sri Eshwar College Logo"
              className="h-7 sm:h-9 w-auto max-w-[95px] sm:max-w-[135px] object-contain"
            />
          </div>

          {/* ISAII Logo Badge (Zoomed) */}
          <div className="flex items-center rounded-xl bg-white px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm border border-white/30 transition-transform group-hover:scale-105 shrink-0">
            <img
              src={isaiiCleanLogo}
              alt="ISAII Logo"
              className="h-7 sm:h-9 w-auto max-w-[55px] sm:max-w-[90px] object-contain scale-110 sm:scale-120"
            />
          </div>

          <div className="hidden md:flex flex-col ml-1">
            <span className="text-base font-bold tracking-tight text-[var(--white)] leading-none">
              TMS Portal
            </span>
            <span className="text-[10px] font-medium text-white/60 tracking-wider uppercase">
              Ticket Management
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white/18 text-[var(--white)] shadow-xs'
                    : 'text-white/75 hover:bg-white/10 hover:text-[var(--white)]'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions (User info / Logout / Staff Login / Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-bold text-[var(--white)] leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] capitalize text-white/60 font-medium">
                  {user.role}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--primary-blue-deeper)] text-xs font-bold uppercase shrink-0 shadow-xs">
                {getInitials(user.name)}
              </div>
              <button
                type="button"
                className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-[var(--white)] sm:inline-flex cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-8 items-center gap-1 rounded-lg px-3 sm:px-4 text-xs font-bold bg-[var(--gold)] text-[var(--primary-blue-deeper)] hover:bg-[var(--gold-dark)] transition-colors shadow-xs shrink-0 whitespace-nowrap"
            >
              Staff Login
            </Link>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className="rounded-lg p-1.5 sm:p-2 text-white/80 hover:bg-white/10 hover:text-[var(--white)] md:hidden cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {open && (
        <div className="border-t border-white/10 bg-[var(--primary-blue-dark)] px-4 py-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-white/20 text-[var(--white)]'
                      : 'text-white/75 hover:bg-white/10 hover:text-[var(--white)]'
                  )
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--primary-blue-deeper)] text-xs font-bold uppercase">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">{user.name}</p>
                  <p className="text-[11px] text-white/50 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
