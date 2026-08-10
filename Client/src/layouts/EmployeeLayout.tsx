import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket } from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const employeeItems: SidebarItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/tickets', label: 'My Tickets', icon: Ticket },
]

export function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        items={employeeItems.map(({ to, label }) => ({ to, label }))}
        brandTo="/employee/dashboard"
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar items={employeeItems} title="Employee" />
        <div className="min-w-0 flex-1">
          <MobileNav items={employeeItems} />
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
