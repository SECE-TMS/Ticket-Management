import api from './api'
import type { AdminDashboard, EmployeeDashboard, ManagerDashboard } from '../types'

export const dashboardService = {
  async admin() {
    const { data } = await api.get('/dashboard/admin')
    return data.data as AdminDashboard
  },

  async manager() {
    const { data } = await api.get('/dashboard/manager')
    return data.data as ManagerDashboard
  },

  async employee() {
    const { data } = await api.get('/dashboard/employee')
    return data.data as EmployeeDashboard
  },
}
