import { Outlet } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react'
import { Sidebar, type SidebarItem } from '../components/common/Sidebar'

const superadminItems: SidebarItem[] = [
  { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/superadmin/admins', label: 'Manage Admins', icon: ShieldCheck },
  { to: '/superadmin/departments', label: 'Dept. Reports', icon: Building2 },
  { to: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function SuperAdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      {/* Sidebar shows Crown icon in title area */}
      <Sidebar items={superadminItems} title="Super Admin" />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen lg:pl-[260px]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
