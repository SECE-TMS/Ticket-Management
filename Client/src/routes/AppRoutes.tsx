import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { ManagerLayout } from '../layouts/ManagerLayout'
import { EmployeeLayout } from '../layouts/EmployeeLayout'
import { ProtectedRoute, RoleRoute } from '../components/common/ProtectedRoute'
import { Landing } from '../pages/public/Landing'
import { RaiseTicket } from '../pages/public/RaiseTicket'
import { TrackTicket } from '../pages/public/TrackTicket'
import { Login } from '../pages/public/Login'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { AdminDepartments } from '../pages/admin/AdminDepartments'
import { AdminUsers } from '../pages/admin/AdminUsers'
import {
  AdminTicketDetail,
  AdminTickets,
  EmployeeTicketDetail,
  EmployeeTickets,
  ManagerTicketDetail,
  ManagerTickets,
} from '../pages/roleTickets'
import { ManagerDashboard } from '../pages/manager/ManagerDashboard'
import { ManagerEmployees } from '../pages/manager/ManagerEmployees'
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard'

import { QrGeneratorPage } from '../pages/shared/QrGeneratorPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/raise-ticket" element={<RaiseTicket />} />
          <Route path="/track-ticket" element={<TrackTicket />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="tickets/:id" element={<AdminTicketDetail />} />
              <Route path="qr-generator" element={<QrGeneratorPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={['manager']} />}>
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="employees" element={<ManagerEmployees />} />
              <Route path="tickets" element={<ManagerTickets />} />
              <Route path="tickets/:id" element={<ManagerTicketDetail />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={['employee']} />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="tickets" element={<EmployeeTickets />} />
              <Route path="tickets/:id" element={<EmployeeTicketDetail />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
