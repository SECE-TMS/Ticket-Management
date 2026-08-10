import { Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, Ticket, Users } from 'lucide-react'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const adminItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Full-Height Desktop Left Sidebar */}
      <Sidebar items={adminItems} title="Admin" />

      {/* Main Content Area (Offset by 260px sidebar width on desktop) */}
      <div className="flex flex-1 min-w-0 flex-col lg:pl-[260px]">
        <MobileNav items={adminItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
