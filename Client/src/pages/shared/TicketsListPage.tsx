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
  const [limit, setLimit] = useState(10)
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
        limit,
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
  }, [page, limit, debouncedSearch, status, priority, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, priority, limit])

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          total > 0 ? (
            <span className="inline-flex items-center rounded-full bg-[var(--primary-blue)] px-3.5 py-1 text-xs font-bold text-[var(--white)] shadow-xs">
              {total} ticket{total === 1 ? '' : 's'}
            </span>
          ) : undefined
        }
      />

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
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
