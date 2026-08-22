import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket } from 'lucide-react'
import { Sidebar, type SidebarItem } from '../components/common/Sidebar'

const employeeItems: SidebarItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/tickets', label: 'My Tickets', icon: Ticket },
]

export function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Sidebar handles Mobile Header & Desktop Sidebar */}
      <Sidebar items={employeeItems} title="Employee" />

      {/* Main Content Area (Offset by 260px sidebar width on desktop) */}
      <div className="flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden lg:pl-[260px]">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
