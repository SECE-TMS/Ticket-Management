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
}
