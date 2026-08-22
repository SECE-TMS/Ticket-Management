import { Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, MessageSquare, QrCode, Settings, Ticket, Users } from 'lucide-react'
import { Sidebar, type SidebarItem } from '../components/common/Sidebar'

const adminItems: SidebarItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/qr-generator', label: 'QR Generator', icon: QrCode },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Sidebar handles Mobile Header & Desktop Sidebar */}
      <Sidebar items={adminItems} title="Admin" />

      {/* Main Content Area (Offset by 260px sidebar width on desktop) */}
      <div className="flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden lg:pl-[260px]">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
