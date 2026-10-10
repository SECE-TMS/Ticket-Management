import api from './api'
import type {
  Activity,
  Pagination,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../types'

export interface TicketListParams {
  page?: number
  limit?: number
  status?: TicketStatus | ''
  priority?: TicketPriority | ''
  department?: string
  assignedTo?: string
  search?: string
  from?: string
  to?: string
}

export interface UpdateTicketPayload {
  department?: string
  complaintType?: string
  title?: string
  description?: string
  priority?: TicketPriority
  requester?: {
    name?: string
    mobile?: string
    email?: string
    userType?: 'student' | 'staff' | 'guest'
    rollNumber?: string
    department?: string
  }
}

export const ticketService = {
  async create(formData: FormData) {
    const { data } = await api.post('/tickets', formData)
    return data.data as Ticket
  },

  async track(ticketCode: string, mobile: string) {
    const { data } = await api.get('/tickets/track', {
      params: { ticketCode, mobile },
    })
    return data.data as { ticket: Ticket; activities: Activity[] }
  },

  async list(params: TicketListParams = {}) {
    const { data } = await api.get('/tickets', { params })
    return data.data as { items: Ticket[]; pagination: Pagination }
  },

  async getById(id: string) {
    const { data } = await api.get(`/tickets/${id}`)
    return data.data as { ticket: Ticket; activities: Activity[] }
  },

  async update(id: string, payload: UpdateTicketPayload) {
    const { data } = await api.patch(`/tickets/${id}`, payload)
    return data.data as Ticket
  },

  async assign(id: string, payload: { assignedTo: string; priority?: TicketPriority }) {
    const { data } = await api.patch(`/tickets/${id}/assign`, payload)
    return data.data as Ticket
  },

  async reassign(id: string, payload: { assignedTo: string; message?: string }) {
    const { data } = await api.patch(`/tickets/${id}/reassign`, payload)
    return data.data as Ticket
  },

  async updateStatus(id: string, payload: { status: 'accepted' | 'in_progress'; message?: string }) {
    const { data } = await api.patch(`/tickets/${id}/status`, payload)
    return data.data as Ticket
  },

  async resolve(id: string, formData: FormData) {
    const { data } = await api.post(`/tickets/${id}/resolve`, formData)
    return data.data as Ticket
  },

  async updateResolution(id: string, formData: FormData) {
    const { data } = await api.post(`/tickets/${id}/update-resolution`, formData)
    return data.data as Ticket
  },

  async close(id: string) {
    const { data } = await api.patch(`/tickets/${id}/close`)
    return data.data as Ticket
  },

  async reopen(id: string, message?: string) {
    const { data } = await api.patch(`/tickets/${id}/reopen`, { message })
    return data.data as Ticket
  },

  async comment(id: string, message: string) {
    const { data } = await api.post(`/tickets/${id}/comments`, { message })
    return data.data as Ticket
  },

  async submitFeedback(payload: {
    ticketCode: string
    mobile: string
    rating: number
    comment?: string
    tags?: string[]
  }) {
    const { data } = await api.post('/tickets/feedback', payload)
    return data.data as Ticket
  },

  async submitStaffFeedback(
    id: string,
    payload: { rating: number; comment?: string; tags?: string[] }
  ) {
    const { data } = await api.post(`/tickets/${id}/feedback`, payload)
    return data.data as Ticket
  },

  async trackApproveClose(payload: { ticketCode: string; mobile: string; message?: string }) {
    const { data } = await api.post('/tickets/track/approve-close', payload)
    return data.data as { ticket: Ticket; activities: Activity[] }
  },

  async trackReopen(payload: { ticketCode: string; mobile: string; message: string }) {
    const { data } = await api.post('/tickets/track/reopen', payload)
    return data.data as { ticket: Ticket; activities: Activity[] }
  },

  async trackComment(payload: { ticketCode: string; mobile: string; message: string }) {
    const { data } = await api.post('/tickets/track/comment', payload)
    return data.data as { ticket: Ticket; activities: Activity[] }
  },

  async getAdminFeedback(params: {
    page?: number
    limit?: number
    department?: string
    category?: string
    rating?: number
    period?: string
    search?: string
    from?: string
    to?: string
  } = {}) {
    const { data } = await api.get('/tickets/admin/feedback', { params })
    return data.data as { items?: Ticket[]; tickets?: Ticket[]; pagination: Pagination }
  },

  async getDepartmentFeedbackAnalytics(params: { period?: string; department?: string; from?: string; to?: string } = {}) {
    const { data } = await api.get('/tickets/admin/feedback/department-analytics', { params })
    return data.data as import('../types').DepartmentFeedbackAnalytics[]
  },

  async getCategoryFeedbackAnalytics(params: { period?: string; department?: string; from?: string; to?: string } = {}) {
    const { data } = await api.get('/tickets/admin/feedback/category-analytics', { params })
    return data.data as import('../types').CategoryFeedbackAnalytics[]
  },

  async getTimeWiseFeedbackAnalytics(params: { department?: string; category?: string; from?: string; to?: string } = {}) {
    const { data } = await api.get('/tickets/admin/feedback/timewise-analytics', { params })
    return data.data as import('../types').TimeWiseFeedbackAnalytics
  },

  async exportExcel(params: TicketListParams = {}) {
    const response = await api.get('/tickets/export-excel', {
      params,
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tickets_report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  async approveClose(id: string, message?: string) {
    const { data } = await api.patch(`/tickets/${id}/approve-close`, { message })
    return data.data as Ticket
  },
}
