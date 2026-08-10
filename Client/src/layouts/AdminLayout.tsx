import { Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, Ticket, Users } from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const adminItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar items={adminItems.map(({ to, label }) => ({ to, label }))} brandTo="/admin/dashboard" />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar items={adminItems} title="Admin" />
        <div className="min-w-0 flex-1">
          <MobileNav items={adminItems} />
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
