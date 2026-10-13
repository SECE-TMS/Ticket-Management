import { useCallback, useEffect, useState } from 'react'
import { ticketService, type TicketListParams } from '../../services/ticketService'
import { departmentService } from '../../services/departmentService'
import { TicketFilters } from '../../components/tickets/TicketFilters'
import { TicketTable } from '../../components/tickets/TicketTable'
import { Pagination } from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { Department, Ticket, TicketPriority, TicketStatus } from '../../types'

interface TicketsPageProps {
  title: string
  description: string
  detailBase: string
}

export function TicketsListPage({ title, description, detailBase }: TicketsPageProps) {
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'csv' | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [department, setDepartment] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [limit, setLimit] = useState(10)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (role === 'admin') {
      departmentService.listAll().then(setDepartments).catch(() => {})
    } else if (role === 'manager' && user) {
      const userDepts = (user.departments && user.departments.length > 0
        ? user.departments
        : user.department
          ? [user.department]
          : []
      ).filter((d): d is Department => typeof d === 'object' && d !== null)

      if (userDepts.length > 0) {
        setDepartments(userDepts)
      } else {
        departmentService.listAll().then((all) => {
          const managerDeptIds = (user.departments || [user.department])
            .map((d: any) => (typeof d === 'object' ? d?._id : d))
            .filter(Boolean)
          setDepartments(all.filter((d) => managerDeptIds.includes(d._id)))
        }).catch(() => {})
      }
    }
  }, [role, user])

  const hasActiveFilters = Boolean(
    search.trim() ||
    status ||
    priority ||
    department ||
    fromDate ||
    toDate
  )

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatus('')
    setPriority('')
    setDepartment('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const getFilterParams = (): TicketListParams => {
    const activeSearch = (search || debouncedSearch || '').trim()
    return {
      search: activeSearch || undefined,
      status: status || undefined,
      priority: priority || undefined,
      department: department || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: TicketListParams = {
        page,
        limit,
        ...getFilterParams(),
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
  }, [page, limit, debouncedSearch, search, status, priority, department, fromDate, toDate, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, priority, department, fromDate, toDate, limit])

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      const params = getFilterParams()
      await ticketService.exportExcel(params)
      toast.success(
        hasActiveFilters
          ? `Filtered Excel Report (${total} tickets) downloaded successfully`
          : 'Excel Report downloaded successfully'
      )
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export Excel report'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportCsv = async () => {
    setExporting('csv')
    try {
      const params = getFilterParams()
      await ticketService.exportCsv(params)
      toast.success(
        hasActiveFilters
          ? `Filtered CSV Report (${total} tickets) downloaded successfully`
          : 'CSV Report downloaded successfully'
      )
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export CSV report'))
    } finally {
      setExporting(null)
    }
  }

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
        department={department}
        fromDate={fromDate}
        toDate={toDate}
        departments={departments}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onDepartmentChange={role === 'admin' || (role === 'manager' && departments.length > 1) ? setDepartment : undefined}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        exporting={exporting}
        filteredCount={total}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
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
