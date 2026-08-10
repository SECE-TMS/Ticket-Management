import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket } from 'lucide-react'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const employeeItems: SidebarItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/tickets', label: 'My Tickets', icon: Ticket },
]

export function EmployeeLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Full-Height Desktop Left Sidebar */}
      <Sidebar items={employeeItems} title="Employee" />

      {/* Main Content Area (Offset by 260px sidebar width on desktop) */}
      <div className="flex flex-1 min-w-0 flex-col lg:pl-[260px]">
        <MobileNav items={employeeItems} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
