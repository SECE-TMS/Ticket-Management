import { Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, Ticket, Users } from 'lucide-react'
import { TopBar } from '../components/common/Navbar'
import { MobileNav, Sidebar, type SidebarItem } from '../components/common/Sidebar'

const adminItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export function AdminLayout() {
  return (
    <div className="app-shell">
      <Sidebar items={adminItems} title="Admin" />
      <div className="main-content">
        <TopBar />
        <MobileNav items={adminItems} />
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
