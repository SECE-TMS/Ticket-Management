import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Layers,
  MessageSquare,
  MessageSquareQuote,
  RefreshCw,
  Search,
  Star,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { ticketService } from '../../services/ticketService'
import { departmentService } from '../../services/departmentService'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type {
  CategoryFeedbackAnalytics,
  Department,
  DepartmentFeedbackAnalytics,
  Ticket,
  TimeWiseFeedbackAnalytics,
} from '../../types'

type PeriodOption = 'all' | 'today' | 'this_week' | 'this_month' | '30d' | '90d' | 'custom'
type ViewMode = 'category' | 'department' | 'timewise'
type TrendTab = 'weekly' | 'monthly'

export function AdminFeedback() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Data States
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentFeedbackAnalytics[]>([])
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryFeedbackAnalytics[]>([])
  const [timeWiseAnalytics, setTimeWiseAnalytics] = useState<TimeWiseFeedbackAnalytics>({
    weekly: [],
    monthly: [],
  })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Selection & View States
  const [period, setPeriod] = useState<PeriodOption>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('category')
  const [trendTab, setTrendTab] = useState<TrendTab>('weekly')

  // Table Filters
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Feedback detail modal state
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<Ticket | null>(null)

  // Compute all available complaint categories from departments & analytics
  const allCategories = useMemo(() => {
    return Array.from(
      new Set([
        ...departments.flatMap((d) => d.complaintTypes || []),
        ...categoryAnalytics.map((c) => c.categoryName),
      ])
    ).sort()
  }, [departments, categoryAnalytics])

  // Preset handler
  const handlePeriodChange = (p: PeriodOption) => {
    setPeriod(p)
    setPage(1)
    if (p === 'all') {
      setFromDate('')
      setToDate('')
    } else if (p === 'today') {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      setFromDate(todayStr)
      setToDate(todayStr)
    } else if (p === 'this_week') {
      const now = new Date()
      const past = new Date()
      past.setDate(now.getDate() - 7)
      setFromDate(format(past, 'yyyy-MM-dd'))
      setToDate(format(now, 'yyyy-MM-dd'))
    } else if (p === 'this_month') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      setFromDate(format(startOfMonth, 'yyyy-MM-dd'))
      setToDate(format(now, 'yyyy-MM-dd'))
    } else if (p === '30d') {
      const now = new Date()
      const past = new Date()
      past.setDate(now.getDate() - 30)
      setFromDate(format(past, 'yyyy-MM-dd'))
      setToDate(format(now, 'yyyy-MM-dd'))
    } else if (p === '90d') {
      const now = new Date()
      const past = new Date()
      past.setDate(now.getDate() - 90)
      setFromDate(format(past, 'yyyy-MM-dd'))
      setToDate(format(now, 'yyyy-MM-dd'))
    }
  }

  const handleCustomDateChange = (fromVal: string, toVal: string) => {
    setFromDate(fromVal)
    setToDate(toVal)
    setPeriod('custom')
    setPage(1)
  }

  const handleClearAllFilters = () => {
    setPeriod('all')
    setFromDate('')
    setToDate('')
    setSearch('')
    setSelectedDept('')
    setSelectedCategory('')
    setSelectedRating('')
    setPage(1)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const filterParams = {
        period: period !== 'custom' ? period : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        department: selectedDept || undefined,
        category: selectedCategory || undefined,
      }

      const [deptAnalyticsRes, catAnalyticsRes, timeAnalyticsRes, deptRes, feedbackRes] =
        await Promise.all([
          ticketService.getDepartmentFeedbackAnalytics(filterParams),
          ticketService.getCategoryFeedbackAnalytics(filterParams),
          ticketService.getTimeWiseFeedbackAnalytics(filterParams),
          departmentService.listActive(),
          ticketService.getAdminFeedback({
            page,
            limit: 15,
            search: search.trim() || undefined,
            department: selectedDept || undefined,
            category: selectedCategory || undefined,
            rating: selectedRating === '' ? undefined : Number(selectedRating),
            period: period !== 'custom' ? period : undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          }),
        ])

      setDepartmentAnalytics(deptAnalyticsRes || [])
      setCategoryAnalytics(catAnalyticsRes || [])
      setTimeWiseAnalytics(timeAnalyticsRes || { weekly: [], monthly: [] })
      setDepartments(deptRes || [])
      setTickets(feedbackRes.tickets || feedbackRes.items || [])
      setTotalPages(feedbackRes.pagination?.totalPages || 1)
      setTotalItems(feedbackRes.pagination?.total || 0)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load feedback data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [page, period, fromDate, toDate, selectedDept, selectedCategory, selectedRating])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    void fetchData()
  }

  // Export to CSV
  const handleExportCsv = () => {
    if (tickets.length === 0) {
      toast.error('No feedback entries found to export.')
      return
    }
    setExporting(true)
    try {
      const headers = [
        'Ticket Code',
        'Requester Name',
        'Mobile',
        'Department',
        'Category',
        'Rating',
        'Tags',
        'Feedback Comment',
        'Date Submitted',
      ]

      const escapeCell = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`

      const rows = tickets.map((t) => {
        const dept =
          typeof t.department === 'object' && t.department !== null
            ? (t.department as Department).name
            : ''
        const fb = t.feedback
        return [
          escapeCell(t.ticketCode),
          escapeCell(t.requester?.name),
          escapeCell(t.requester?.mobile),
          escapeCell(dept),
          escapeCell(t.complaintType),
          escapeCell(fb?.rating ?? ''),
          escapeCell((fb?.tags || []).join('; ')),
          escapeCell(fb?.comment || ''),
          escapeCell(fb?.submittedAt ? format(new Date(fb.submittedAt), 'yyyy-MM-dd HH:mm:ss') : ''),
        ].join(',')
      })

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute(
        'download',
        `TMS_Customer_Feedback_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Exported ${tickets.length} feedback records!`)
    } catch {
      toast.error('Failed to export feedback data')
    } finally {
      setExporting(false)
    }
  }

  // Active filter count indicator
  const hasActiveFilters =
    period !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(search) ||
    Boolean(selectedDept) ||
    Boolean(selectedCategory) ||
    selectedRating !== ''

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen text-[var(--ink)]">
      {/* ── Page Header & Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            {/* <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Star size={22} className="fill-white" />
            </div> */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                Feedback
                {/* <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-black text-amber-700 border border-amber-200/80">
                  <Sparkles size={11} className="text-amber-500 fill-amber-400" />
                  Live Insights
                </span> */}
              </h1>
              {/* <p className="mt-0.5 text-xs sm:text-sm text-[var(--ink-muted)]">
                Track satisfaction ratings, analyze complaint categories, review requester comments,
                and monitor quality trends.
              </p> */}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting || tickets.length === 0}
            className="font-bold text-xs gap-1.5 shadow-xs cursor-pointer border-[var(--border)] hover:bg-slate-50"
          >
            <Download size={14} /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            disabled={loading}
            className="font-bold text-xs gap-1.5 shadow-xs cursor-pointer border-[var(--border)]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[var(--primary-blue)]' : ''} />
            Refresh
          </Button>
        </div>
      </div>


      {/* ── Date Filter & Preset Controls ───────────────────────────────────── */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--primary-blue)]" />
            <span className="text-sm font-extrabold text-[var(--ink)]">
              Date &amp; Timeframe Filters
            </span>
          </div>

          {/* Date Presets Button Group */}
          <div className="flex items-center gap-1.5 flex-wrap bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border)] text-xs font-bold">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs (Visible when Custom or active) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <label className="block text-[10px] font-black uppercase text-[var(--ink-muted)] tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleCustomDateChange(e.target.value, toDate)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:bg-white transition-colors"
              />
            </div>
            <span className="text-slate-400 font-bold self-end mb-2.5">→</span>
            <div className="relative flex-1">
              <label className="block text-[10px] font-black uppercase text-[var(--ink-muted)] tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleCustomDateChange(fromDate, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end">
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                  setPeriod('all')
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <X size={13} /> Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-[var(--ink-muted)] flex items-center gap-1">
              <Filter size={12} /> Active:
            </span>

            {period !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                Period: {period.replace('_', ' ')}
                <button
                  type="button"
                  onClick={() => setPeriod('all')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                {fromDate || 'Start'} → {toDate || 'End'}
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                  }}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {selectedDept && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                Dept:{' '}
                {departments.find((d) => d._id === selectedDept)?.name || selectedDept}
                <button
                  type="button"
                  onClick={() => setSelectedDept('')}
                  className="hover:text-amber-950 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="hover:text-purple-950 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {selectedRating !== '' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                Rating: {selectedRating}★
                <button
                  type="button"
                  onClick={() => setSelectedRating('')}
                  className="hover:text-amber-950 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                Query: "{search}"
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] font-extrabold text-rose-600 hover:underline ml-1 cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* ── View Mode Switcher Header ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
              {viewMode === 'category' && <Tag size={20} className="text-[var(--primary-blue)]" />}
              {viewMode === 'department' && (
                <Building2 size={20} className="text-[var(--primary-blue)]" />
              )}
              {viewMode === 'timewise' && (
                <TrendingUp size={20} className="text-[var(--primary-blue)]" />
              )}
              Feedback Analytics &amp; Breakdown
            </h2>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border)] text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('category')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'category'
                  ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Tag size={13} /> Category Wise ({categoryAnalytics.length})
            </button>

            <button
              type="button"
              onClick={() => setViewMode('department')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'department'
                  ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Building2 size={13} /> Department Wise ({departmentAnalytics.length})
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timewise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'timewise'
                  ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <TrendingUp size={13} /> Trends &amp; Charts
            </button>
          </div>
        </div>

        {/* ── MODE 1: Category-Wise Feedback Analytics ───────────────────────── */}
        {viewMode === 'category' && (
          <>
            {categoryAnalytics.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-12 text-center text-sm text-[var(--ink-muted)]">
                <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-60" />
                <p className="font-bold text-slate-700">No feedback submissions found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing your date or department filters to see historical category performance.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryAnalytics.map((cat) => (
                  <div
                    key={cat._id}
                    className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary-blue)]">
                            Complaint Category
                          </span>
                          <h3 className="text-base font-black text-[var(--ink)] leading-snug">
                            {cat.categoryName}
                          </h3>
                          {cat.departmentNames && cat.departmentNames.length > 0 && (
                            <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                              Depts: {cat.departmentNames.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200 shrink-0">
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span>{cat.avgRating}</span>
                        </div>
                      </div>

                      {/* Response Metrics & Satisfaction Rate */}
                      <div className="mt-3.5 flex items-center justify-between border-y border-slate-100 py-2.5 text-xs">
                        <span className="text-[var(--ink-muted)] font-medium">
                          Total Responses: <strong className="text-[var(--ink)]">{cat.totalFeedback}</strong>
                        </span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {cat.satisfactionRate}% Satisfied
                        </span>
                      </div>

                      {/* Star Rating Distribution */}
                      <div className="mt-4 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = cat.distribution[star as 1 | 2 | 3 | 4 | 5] || 0
                          const pct = cat.totalFeedback > 0 ? (count / cat.totalFeedback) * 100 : 0
                          return (
                            <div key={star} className="flex items-center text-xs gap-2">
                              <span className="w-8 text-slate-500 font-bold text-right shrink-0">
                                {star}★
                              </span>
                              <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    star >= 4
                                      ? 'bg-emerald-500'
                                      : star === 3
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-6 text-slate-400 text-right font-semibold text-[11px] shrink-0">
                                {count}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.categoryName)
                        setPage(1)
                      }}
                      className="w-full text-center text-xs font-extrabold text-[var(--primary-blue)] hover:underline pt-2 cursor-pointer"
                    >
                      Filter feedback logs by "{cat.categoryName}" →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODE 2: Department-Wise Feedback Analytics ─────────────────────── */}
        {viewMode === 'department' && (
          <>
            {departmentAnalytics.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-12 text-center text-sm text-[var(--ink-muted)]">
                <Building2 className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-60" />
                <p className="font-bold text-slate-700">No department feedback submissions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {departmentAnalytics.map((dept) => (
                  <div
                    key={dept._id}
                    className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Department Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary-blue)]">
                            {dept.departmentCode || 'DEPT'}
                          </span>
                          <h3 className="text-base font-black text-[var(--ink)] leading-snug">
                            {dept.departmentName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200 shrink-0">
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span>{dept.avgRating}</span>
                        </div>
                      </div>

                      {/* Rating Metrics & Satisfaction Rate */}
                      <div className="mt-3.5 flex items-center justify-between border-y border-slate-100 py-2.5 text-xs">
                        <span className="text-[var(--ink-muted)] font-medium">
                          Total Responses:{' '}
                          <strong className="text-[var(--ink)]">{dept.totalFeedback}</strong>
                        </span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {dept.satisfactionRate}% Satisfied
                        </span>
                      </div>

                      {/* Star Rating Distribution */}
                      <div className="mt-4 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = dept.distribution[star as 1 | 2 | 3 | 4 | 5] || 0
                          const pct =
                            dept.totalFeedback > 0 ? (count / dept.totalFeedback) * 100 : 0
                          return (
                            <div key={star} className="flex items-center text-xs gap-2">
                              <span className="w-8 text-slate-500 font-bold text-right shrink-0">
                                {star}★
                              </span>
                              <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    star >= 4
                                      ? 'bg-emerald-500'
                                      : star === 3
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-6 text-slate-400 text-right font-semibold text-[11px] shrink-0">
                                {count}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDept(dept._id)
                        setPage(1)
                      }}
                      className="w-full text-center text-xs font-extrabold text-[var(--primary-blue)] hover:underline pt-2 cursor-pointer"
                    >
                      Filter feedback logs by {dept.departmentName} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODE 3: Week & Month Wise Feedback Trends ─────────────────────── */}
        {viewMode === 'timewise' && (
          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[var(--ink)]">
                  Feedback Satisfaction Trends Over Time
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Monitor weekly and monthly rating progression and volume.
                </p>
              </div>

              {/* Sub tab toggle between Weekly & Monthly */}
              <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTrendTab('weekly')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    trendTab === 'weekly'
                      ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Calendar size={13} /> Week-Wise
                </button>
                <button
                  type="button"
                  onClick={() => setTrendTab('monthly')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    trendTab === 'monthly'
                      ? 'bg-white text-[var(--primary-blue)] shadow-xs font-black'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Layers size={13} /> Month-Wise
                </button>
              </div>
            </div>

            {/* Visual Recharts Area/Bar Chart */}
            {((trendTab === 'weekly' && timeWiseAnalytics.weekly.length > 0) ||
              (trendTab === 'monthly' && timeWiseAnalytics.monthly.length > 0)) && (
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      trendTab === 'weekly'
                        ? [...timeWiseAnalytics.weekly].reverse()
                        : [...timeWiseAnalytics.monthly].reverse()
                    }
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="satisfactionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="satisfactionRate"
                      name="Satisfaction Rate %"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#satisfactionGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly Trend Table */}
            {trendTab === 'weekly' && (
              <div>
                {timeWiseAnalytics.weekly.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--ink-muted)] border border-dashed border-slate-200 rounded-2xl">
                    No weekly feedback data recorded in this period.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-extrabold border-b border-[var(--border)]">
                        <tr>
                          <th className="p-3.5">Time Period</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-center">Feedbacks</th>
                          <th className="p-3.5 text-center">Avg Rating</th>
                          <th className="p-3.5">Satisfaction Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                        {timeWiseAnalytics.weekly.map((item, idx) => (
                          <tr
                            key={`${item.label}-${item.category}-${idx}`}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3.5 font-bold text-slate-800">{item.label}</td>
                            <td className="p-3.5 font-semibold text-[var(--primary-blue)]">
                              {item.category}
                            </td>
                            <td className="p-3.5 text-center font-bold">{item.totalFeedback}</td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-xs">
                                <Star size={11} className="fill-amber-400 text-amber-500" />
                                {item.avgRating}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-28 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${item.satisfactionRate}%` }}
                                  />
                                </div>
                                <span className="font-extrabold text-emerald-700 text-xs">
                                  {item.satisfactionRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Trend Table */}
            {trendTab === 'monthly' && (
              <div>
                {timeWiseAnalytics.monthly.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--ink-muted)] border border-dashed border-slate-200 rounded-2xl">
                    No monthly feedback data recorded in this period.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-extrabold border-b border-[var(--border)]">
                        <tr>
                          <th className="p-3.5">Month</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-center">Feedbacks</th>
                          <th className="p-3.5 text-center">Avg Rating</th>
                          <th className="p-3.5">Satisfaction Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                        {timeWiseAnalytics.monthly.map((item, idx) => (
                          <tr
                            key={`${item.label}-${item.category}-${idx}`}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3.5 font-bold text-slate-800">{item.label}</td>
                            <td className="p-3.5 font-semibold text-[var(--primary-blue)]">
                              {item.category}
                            </td>
                            <td className="p-3.5 text-center font-bold">{item.totalFeedback}</td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-xs">
                                <Star size={11} className="fill-amber-400 text-amber-500" />
                                {item.avgRating}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-28 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${item.satisfactionRate}%` }}
                                  />
                                </div>
                                <span className="font-extrabold text-emerald-700 text-xs">
                                  {item.satisfactionRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ticket-Wise Feedback List Section ─────────────────────────────────── */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
              <MessageSquare size={18} className="text-[var(--primary-blue)]" />
              Feedback Logs
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Showing {tickets.length} of {totalItems} total rated tickets
            </p>
          </div>

          {/* Search and Table Filters Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket code, category, comment..."
                className="pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:bg-white w-48 sm:w-60 transition-colors font-medium"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Category (Complaint Type) Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(e.target.value === '' ? '' : Number(e.target.value))
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="">All Star Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="font-extrabold text-xs">
              Search
            </Button>
          </form>
        </div>

        {/* Table View for Desktop & Cards View for Mobile */}
        {tickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--ink-muted)] border border-dashed border-slate-200 rounded-3xl bg-[var(--surface-2)]/50 space-y-2">
            <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-400 opacity-60" />
            <p className="font-extrabold text-slate-700">No feedback found</p>
            <p className="text-xs text-slate-500">
              No rated tickets match the current search or date range filters.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="mt-2 text-xs font-bold"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-extrabold border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3.5">Ticket Code</th>
                    <th className="p-3.5">Requester</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Rating &amp; Tags</th>
                    <th className="p-3.5">Customer Comment</th>
                    <th className="p-3.5 text-right">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                  {tickets.map((t) => {
                    const deptObj = t.department as Department
                    const fb = t.feedback
                    const rating = fb?.rating || 0
                    return (
                      <tr
                        key={t._id}
                        onClick={() => setActiveFeedbackModal(t)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="p-3.5 font-bold text-[var(--primary-blue)] whitespace-nowrap">
                          {t.ticketCode}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800">{t.requester?.name || 'Anonymous'}</p>
                          <p className="text-[11px] text-[var(--ink-muted)]">{t.requester?.mobile}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {deptObj?.name || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-800 border border-slate-200/80">
                            <Tag size={11} className="text-slate-500" />
                            {t.complaintType}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= rating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-slate-300'
                                }
                              />
                            ))}
                            <span
                              className={`font-black ml-1 text-xs px-1.5 py-0.2 rounded-md ${
                                rating >= 4
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : rating === 3
                                  ? 'text-amber-700 bg-amber-50'
                                  : 'text-rose-700 bg-rose-50'
                              }`}
                            >
                              {rating}/5
                            </span>
                          </div>
                          {fb?.tags && fb.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {fb.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-700 italic">
                          {fb?.comment ? `"${fb.comment}"` : <span className="text-slate-400 not-italic">No comment</span>}
                        </td>
                        <td className="p-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                          {fb?.submittedAt ? format(new Date(fb.submittedAt), 'dd MMM yyyy, hh:mm a') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {tickets.map((t) => {
                const deptObj = t.department as Department
                const fb = t.feedback
                const rating = fb?.rating || 0
                return (
                  <div
                    key={t._id}
                    onClick={() => setActiveFeedbackModal(t)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--primary-blue)]">
                        {t.ticketCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {fb?.submittedAt ? format(new Date(fb.submittedAt), 'dd MMM yyyy') : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--ink)]">{t.requester?.name}</p>
                        <p className="text-[11px] text-[var(--ink-muted)]">{deptObj?.name}</p>
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200">
                        <Star size={12} className="fill-amber-400 text-amber-500" />
                        <span>{rating}/5</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                        <Tag size={11} className="text-slate-500" />
                        {t.complaintType}
                      </span>
                    </div>

                    {fb?.tags && fb.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fb.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {fb?.comment && (
                      <p className="text-xs italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                        "{fb.comment}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <span className="text-xs text-[var(--ink-muted)]">
                  Page <strong className="text-[var(--ink)]">{page}</strong> of{' '}
                  <strong className="text-[var(--ink)]">{totalPages}</strong> ({totalItems} total records)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-xs font-bold gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="text-xs font-bold gap-1 cursor-pointer"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Feedback Details Popover Modal ─────────────────────────────────── */}
      {activeFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary-blue)]">
                  Feedback Review Details
                </span>
                <h3 className="text-xl font-black text-[var(--ink)]">
                  Ticket #{activeFeedbackModal.ticketCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Requester Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= (activeFeedbackModal.feedback?.rating || 0)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                  <span className="font-black text-sm text-amber-900 ml-2">
                    {activeFeedbackModal.feedback?.rating} / 5.0
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-amber-800">Submitted on</span>
                <p className="text-xs font-bold text-amber-950">
                  {activeFeedbackModal.feedback?.submittedAt
                    ? format(new Date(activeFeedbackModal.feedback.submittedAt), 'dd MMM yyyy, hh:mm a')
                    : '—'}
                </p>
              </div>
            </div>

            {/* Comment */}
            {activeFeedbackModal.feedback?.comment && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                  Customer Comment
                </label>
                <p className="text-sm italic text-slate-800 bg-[var(--surface-2)] p-3.5 rounded-2xl border border-[var(--border)] leading-relaxed">
                  "{activeFeedbackModal.feedback.comment}"
                </p>
              </div>
            )}

            {/* Tags */}
            {activeFeedbackModal.feedback?.tags && activeFeedbackModal.feedback.tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                  Positive &amp; Quality Highlights
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeFeedbackModal.feedback.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[11px] text-[var(--ink-muted)] font-semibold">Requester</span>
                <p className="font-bold text-slate-800">{activeFeedbackModal.requester?.name}</p>
                <p className="text-slate-500 text-[11px]">{activeFeedbackModal.requester?.mobile}</p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--ink-muted)] font-semibold">Department</span>
                <p className="font-bold text-slate-800">
                  {typeof activeFeedbackModal.department === 'object' && activeFeedbackModal.department !== null
                    ? (activeFeedbackModal.department as Department).name
                    : '—'}
                </p>
                <p className="text-slate-500 text-[11px]">{activeFeedbackModal.complaintType}</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFeedbackModal(null)}
                className="w-full font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
