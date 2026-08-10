import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket } from 'lucide-react'
import { TopBar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const employeeItems: SidebarItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/tickets', label: 'My Tickets', icon: Ticket },
]

export function EmployeeLayout() {
  return (
    <div className="app-shell">
      <Sidebar items={employeeItems} title="Employee" />
      <div className="main-content">
        <TopBar />
        <MobileNav items={employeeItems} />
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
