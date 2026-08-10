import { useCallback, useEffect, useState } from 'react'
import { ticketService, type TicketListParams } from '../../services/ticketService'
import { TicketFilters } from '../../components/tickets/TicketFilters'
import { TicketTable } from '../../components/tickets/TicketTable'
import { Pagination } from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Ticket, TicketPriority, TicketStatus } from '../../types'

interface TicketsPageProps {
  title: string
  description: string
  detailBase: string
}

export function TicketsListPage({ title, description, detailBase }: TicketsPageProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: TicketListParams = {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
      }
      const data = await ticketService.list(params)
      setTickets(data.items)
      setPages(data.pagination.pages)
      setTotal(data.pagination.total)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tickets'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, priority, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, priority])

  return (
    <div>
      <PageHeader title={title} description={description} />
      <TicketFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <TicketTable tickets={tickets} detailBase={detailBase} />
          <div className="mt-4">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
