import { Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, QrCode, Ticket, Users } from 'lucide-react'
import { Sidebar, type SidebarItem } from '../components/common/Sidebar'

const adminItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/qr-generator', label: 'QR Generator', icon: QrCode },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Sidebar handles Mobile Header & Desktop Sidebar */}
      <Sidebar items={adminItems} title="Admin" />

      {/* Main Content Area (Offset by 260px sidebar width on desktop) */}
      <div className="flex flex-col min-h-screen lg:pl-[260px]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
