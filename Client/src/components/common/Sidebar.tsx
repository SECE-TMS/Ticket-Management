import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
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

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col p-4">
        <p className="mb-3 px-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-surface hover:text-navy',
                    isActive && 'bg-teal-50 text-accent'
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export function MobileNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600',
                isActive && 'bg-teal-50 text-accent'
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
