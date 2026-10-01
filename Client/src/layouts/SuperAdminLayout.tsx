import { Outlet } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  Crown,
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
        {/* Super Admin Badge Banner */}
        <div className="sticky top-0 z-20 hidden lg:flex items-center gap-2 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-2">
          <Crown size={14} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Super Admin Mode — Full System Control
          </span>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
