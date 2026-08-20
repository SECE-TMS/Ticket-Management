import { useEffect, useState } from 'react'
import {
  Building2,
  Calendar,
  Layers,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Tag,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'
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
import { format } from 'date-fns'

type PeriodOption = 'all' | 'this_week' | 'this_month' | '30d'
type ViewMode = 'category' | 'department' | 'timewise'
type TrendTab = 'weekly' | 'monthly'

export function AdminFeedback() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)

  // Data States
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentFeedbackAnalytics[]>([])
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryFeedbackAnalytics[]>([])
  const [timeWiseAnalytics, setTimeWiseAnalytics] = useState<TimeWiseFeedbackAnalytics>({
    weekly: [],
    monthly: [],
  })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Selection & Filter States
  const [period, setPeriod] = useState<PeriodOption>('all')
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

  // Compute all available complaint categories from departments & analytics
  const allCategories = Array.from(
    new Set([
      ...departments.flatMap((d) => d.complaintTypes || []),
      ...categoryAnalytics.map((c) => c.categoryName),
    ])
  ).sort()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [deptAnalyticsRes, catAnalyticsRes, timeAnalyticsRes, deptRes, feedbackRes] =
        await Promise.all([
          ticketService.getDepartmentFeedbackAnalytics({ period, department: selectedDept }),
          ticketService.getCategoryFeedbackAnalytics({ period, department: selectedDept }),
          ticketService.getTimeWiseFeedbackAnalytics({
            department: selectedDept,
            category: selectedCategory,
          }),
          departmentService.listActive(),
          ticketService.getAdminFeedback({
            page,
            limit: 15,
            search,
            department: selectedDept,
            category: selectedCategory,
            rating: selectedRating === '' ? undefined : Number(selectedRating),
            period,
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
  }, [page, period, selectedDept, selectedCategory, selectedRating])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    void fetchData()
  }

  // Calculate overall metrics
  const activeAnalyticsList =
    viewMode === 'category' ? categoryAnalytics : departmentAnalytics
  const totalFeedbackCount = activeAnalyticsList.reduce(
    (acc, curr) => acc + curr.totalFeedback,
    0
  )
  const overallAvgRating =
    totalFeedbackCount > 0
      ? (
          activeAnalyticsList.reduce(
            (acc, curr) => acc + curr.avgRating * curr.totalFeedback,
            0
          ) / totalFeedbackCount
        ).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight">
              Feedback &amp; Satisfaction Hub
            </h1>
            <span className="rounded-full bg-[var(--gold)]/20 px-3 py-0.5 text-xs font-extrabold text-[var(--gold-dark)] border border-[var(--gold)]/40">
              Admin Insights
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Analyze customer satisfaction scores by category, department, and week/month timeframes.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Time Period Quick Filter */}
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border)] text-xs font-bold">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: '30d', label: 'Past 30 Days' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeriod(p.id)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            disabled={loading}
            className="font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Top Overview Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <Star size={24} className="fill-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Overall Rating
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--ink)]">{overallAvgRating}</span>
              <span className="text-xs font-bold text-amber-600">out of 5.0</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Total Feedbacks
            </p>
            <span className="text-2xl font-black text-[var(--ink)]">{totalFeedbackCount}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Categories Analyzed
            </p>
            <span className="text-2xl font-black text-[var(--ink)]">{categoryAnalytics.length}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ThumbsUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Departments Covered
            </p>
            <span className="text-2xl font-black text-[var(--ink)]">{departmentAnalytics.length}</span>
          </div>
        </div>
      </div>

      {/* ── View Mode Switcher Header ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              {viewMode === 'category' && <Tag size={20} className="text-[var(--primary-blue)]" />}
              {viewMode === 'department' && <Building2 size={20} className="text-[var(--primary-blue)]" />}
              {viewMode === 'timewise' && <TrendingUp size={20} className="text-[var(--primary-blue)]" />}
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
                  ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Tag size={13} /> Category Wise
            </button>

            <button
              type="button"
              onClick={() => setViewMode('department')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'department'
                  ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Building2 size={13} /> Department Wise
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timewise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'timewise'
                  ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <TrendingUp size={13} /> Week &amp; Month Trends
            </button>
          </div>
        </div>

        {/* ── MODE 1: Category-Wise Feedback Analytics ───────────────────────── */}
        {viewMode === 'category' && (
          <>
            {categoryAnalytics.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-sm text-[var(--ink-muted)]">
                No feedback submissions recorded for any category in the selected timeframe.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryAnalytics.map((cat) => (
                  <div
                    key={cat._id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary-blue)]">
                            Category / Complaint Type
                          </span>
                          <h3 className="text-base font-bold text-[var(--ink)] leading-snug">
                            {cat.categoryName}
                          </h3>
                          {cat.departmentNames && cat.departmentNames.length > 0 && (
                            <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                              Depts: {cat.departmentNames.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200 shrink-0">
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span>{cat.avgRating}</span>
                        </div>
                      </div>

                      {/* Response Metrics & Satisfaction Rate */}
                      <div className="mt-3 flex items-center justify-between border-y border-slate-100 py-2 text-xs">
                        <span className="text-[var(--ink-muted)]">
                          Total Feedbacks: <strong>{cat.totalFeedback}</strong>
                        </span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
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
                                      : 'bg-red-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-6 text-slate-400 text-right font-medium text-[11px] shrink-0">
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
                      className="w-full text-center text-xs font-bold text-[var(--primary-blue)] hover:underline pt-2 cursor-pointer"
                    >
                      Filter Table by "{cat.categoryName}" →
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
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-sm text-[var(--ink-muted)]">
                No department feedback submissions recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {departmentAnalytics.map((dept) => (
                  <div
                    key={dept._id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Department Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary-blue)]">
                            {dept.departmentCode || 'DEPT'}
                          </span>
                          <h3 className="text-base font-bold text-[var(--ink)] leading-snug">
                            {dept.departmentName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200 shrink-0">
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span>{dept.avgRating}</span>
                        </div>
                      </div>

                      {/* Rating Metrics & Satisfaction Rate */}
                      <div className="mt-3 flex items-center justify-between border-y border-slate-100 py-2 text-xs">
                        <span className="text-[var(--ink-muted)]">
                          Total Responses: <strong>{dept.totalFeedback}</strong>
                        </span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {dept.satisfactionRate}% Satisfied
                        </span>
                      </div>

                      {/* Star Rating Distribution */}
                      <div className="mt-4 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = dept.distribution[star as 1 | 2 | 3 | 4 | 5] || 0
                          const pct = dept.totalFeedback > 0 ? (count / dept.totalFeedback) * 100 : 0
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
                                      : 'bg-red-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-6 text-slate-400 text-right font-medium text-[11px] shrink-0">
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
                      className="w-full text-center text-xs font-bold text-[var(--primary-blue)] hover:underline pt-2 cursor-pointer"
                    >
                      Filter Table by {dept.departmentName} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODE 3: Week & Month Wise Feedback Trends ─────────────────────── */}
        {viewMode === 'timewise' && (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  Time-Wise Category Feedback Performance
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Track week-by-week and month-by-month satisfaction rates and feedback volume per category.
                </p>
              </div>

              {/* Sub tab toggle between Weekly & Monthly */}
              <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTrendTab('weekly')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    trendTab === 'weekly'
                      ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Calendar size={13} /> Week-Wise
                </button>
                <button
                  type="button"
                  onClick={() => setTrendTab('monthly')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    trendTab === 'monthly'
                      ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Layers size={13} /> Month-Wise
                </button>
              </div>
            </div>

            {/* Weekly Trend Table */}
            {trendTab === 'weekly' && (
              <div>
                {timeWiseAnalytics.weekly.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--ink-muted)] border border-dashed border-slate-200 rounded-2xl">
                    No weekly feedback data recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-bold border-b border-[var(--border)]">
                        <tr>
                          <th className="p-3.5">Time Period</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-center">Feedbacks</th>
                          <th className="p-3.5 text-center">Average Score</th>
                          <th className="p-3.5">Satisfaction Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                        {timeWiseAnalytics.weekly.map((item, idx) => (
                          <tr key={`${item.label}-${item.category}-${idx}`} className="hover:bg-[var(--surface-2)]/50">
                            <td className="p-3.5 font-bold text-slate-700">{item.label}</td>
                            <td className="p-3.5 font-semibold text-[var(--primary-blue)]">
                              {item.category}
                            </td>
                            <td className="p-3.5 text-center font-bold">{item.totalFeedback}</td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200 text-xs">
                                <Star size={12} className="fill-amber-400 text-amber-500" />
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
                    No monthly feedback data recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-bold border-b border-[var(--border)]">
                        <tr>
                          <th className="p-3.5">Month</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-center">Feedbacks</th>
                          <th className="p-3.5 text-center">Average Score</th>
                          <th className="p-3.5">Satisfaction Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                        {timeWiseAnalytics.monthly.map((item, idx) => (
                          <tr key={`${item.label}-${item.category}-${idx}`} className="hover:bg-[var(--surface-2)]/50">
                            <td className="p-3.5 font-bold text-slate-700">{item.label}</td>
                            <td className="p-3.5 font-semibold text-[var(--primary-blue)]">
                              {item.category}
                            </td>
                            <td className="p-3.5 text-center font-bold">{item.totalFeedback}</td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200 text-xs">
                                <Star size={12} className="fill-amber-400 text-amber-500" />
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
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)]">
              Ticket-Wise Feedback Logs
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Showing {tickets.length} of {totalItems} rated tickets
            </p>
          </div>

          {/* Search and Filter Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket code, category, comment..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] w-48 sm:w-56"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value)
                setPage(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
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
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
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
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="">All Star Ratings</option>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Very Good)</option>
              <option value="3">3 Stars (Good)</option>
              <option value="2">2 Stars (Fair)</option>
              <option value="1">1 Star (Poor)</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
          </form>
        </div>

        {/* Table View for Desktop & Cards View for Mobile */}
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--ink-muted)] border border-dashed border-slate-200 rounded-2xl">
            No feedback found matching the selected filter criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-bold border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3.5">Ticket</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Requester</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Rating &amp; Tags</th>
                    <th className="p-3.5">Customer Comment</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                  {tickets.map((t) => {
                    const deptObj = t.department as Department
                    const fb = t.feedback
                    return (
                      <tr key={t._id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                        <td className="p-3.5 font-bold text-[var(--primary-blue)]">
                          {t.ticketCode}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-800 border border-slate-200">
                            <Tag size={11} className="text-slate-500" />
                            {t.complaintType}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold">{t.requester.name}</p>
                          <p className="text-[11px] text-[var(--ink-muted)]">
                            {t.requester.mobile}
                          </p>
                        </td>
                        <td className="p-3.5 font-semibold">{deptObj?.name || '—'}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= (fb?.rating || 0)
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-slate-300'
                                }
                              />
                            ))}
                            <span className="font-bold ml-1 text-slate-800">{fb?.rating}/5</span>
                          </div>
                          {fb?.tags && fb.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {fb.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-700 italic">
                          {fb?.comment ? `"${fb.comment}"` : '—'}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {fb?.submittedAt ? format(new Date(fb.submittedAt), 'dd MMM yyyy') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {tickets.map((t) => {
                const deptObj = t.department as Department
                const fb = t.feedback
                return (
                  <div
                    key={t._id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-2.5"
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
                        <p className="text-xs font-bold text-[var(--ink)]">{t.requester.name}</p>
                        <p className="text-[11px] text-[var(--ink-muted)]">{deptObj?.name}</p>
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200">
                        <Star size={12} className="fill-amber-400 text-amber-500" />
                        <span>{fb?.rating}/5</span>
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
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--ink-muted)]">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
