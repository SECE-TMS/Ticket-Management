import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket, Users } from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const managerItems: SidebarItem[] = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/tickets', label: 'Tickets', icon: Ticket },
  { to: '/manager/employees', label: 'Employees', icon: Users },
]

export function ManagerLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        items={managerItems.map(({ to, label }) => ({ to, label }))}
        brandTo="/manager/dashboard"
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar items={managerItems} title="Manager" />
        <div className="min-w-0 flex-1">
          <MobileNav items={managerItems} />
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
