import api from './api'
import type { User } from '../types'

export interface DeptReport {
  departmentId: string
  name: string
  description?: string
  isActive?: boolean
  manager?: { name: string; email?: string } | null
  stats: {
    total: number
    open: number
    resolved: number
    closed: number
    pendingApproval: number
    overdue: number
    resolutionRate: number
    avgRating: number
    totalFeedback: number
  }
  staff: {
    managers: number
    employees: number
    total: number
  }
}

export interface SuperAdminDashboardData {
  totals: {
    users: number
    admins: number
    managers: number
    employees: number
    tickets: number
    openTickets: number
    closedTickets: number
    pendingApprovalTickets: number
    overdueTickets: number
  }
  monthlyTrend: Array<{
    _id: { year: number; month: number }
    created: number
    resolved: number
  }>
  departmentReport: DeptReport[]
}

export const superadminService = {
  async getDashboard() {
    const { data } = await api.get('/superadmin/dashboard')
    return data.data as SuperAdminDashboardData
  },

  async getDepartmentReport() {
    const { data } = await api.get('/superadmin/department-report')
    return data.data as DeptReport[]
  },

  async listAdmins(params: { page?: number; limit?: number; isActive?: string; search?: string } = {}) {
    const { data } = await api.get('/superadmin/admins', { params })
    return data.data as { items: User[]; pagination: { page: number; limit: number; total: number; pages: number } }
  },

  async createAdmin(payload: { name: string; email: string; password: string; phone?: string }) {
    const { data } = await api.post('/superadmin/admins', payload)
    return data.data as User
  },

  async updateAdmin(id: string, payload: { name?: string; phone?: string; isActive?: boolean }) {
    const { data } = await api.put(`/superadmin/admins/${id}`, payload)
    return data.data as User
  },

  async toggleAdminStatus(id: string, isActive: boolean) {
    const { data } = await api.patch(`/superadmin/admins/${id}/status`, { isActive })
    return data.data as User
  },

  async resetAdminPassword(id: string, newPassword: string) {
    const { data } = await api.put(`/superadmin/admins/${id}/reset-password`, { newPassword })
    return data.data as { message: string }
  },
}
