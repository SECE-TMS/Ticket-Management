import { TicketsListPage } from './shared/TicketsListPage'
import { TicketDetailPage } from './shared/TicketDetailPage'

export function AdminTickets() {
  return (
    <TicketsListPage
      title="All tickets"
      description="Search and filter facility requests across departments."
      detailBase="/admin/tickets"
    />
  )
}

export function AdminTicketDetail() {
  return <TicketDetailPage backTo="/admin/tickets" />
}

export function ManagerTickets() {
  return (
    <TicketsListPage
      title="Department tickets"
      description="Assign, prioritize, close, and reopen requests for your team."
      detailBase="/manager/tickets"
    />
  )
}

export function ManagerTicketDetail() {
  return <TicketDetailPage backTo="/manager/tickets" />
}

export function EmployeeTickets() {
  return (
    <TicketsListPage
      title="My tickets"
      description="Accept work, update progress, and resolve with proof."
      detailBase="/employee/tickets"
    />
  )
}

export function EmployeeTicketDetail() {
  return <TicketDetailPage backTo="/employee/tickets" />
}
