import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Ticket, Users } from 'lucide-react'
import { TopBar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const managerItems: SidebarItem[] = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/tickets', label: 'Tickets', icon: Ticket },
  { to: '/manager/employees', label: 'Employees', icon: Users },
]

export function ManagerLayout() {
  return (
    <div className="app-shell">
      <Sidebar items={managerItems} title="Manager" />
      <div className="main-content">
        <TopBar />
        <MobileNav items={managerItems} />
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
