import { useEffect, useState } from 'react'
import {
  Building2,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  ThumbsUp,
} from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { departmentService } from '../../services/departmentService'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department, DepartmentFeedbackAnalytics, Ticket } from '../../types'
import { format } from 'date-fns'

export function AdminFeedback() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<DepartmentFeedbackAnalytics[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedRating, setSelectedRating] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, deptRes, feedbackRes] = await Promise.all([
        ticketService.getDepartmentFeedbackAnalytics(),
        departmentService.listActive(),
        ticketService.getAdminFeedback({
          page,
          limit: 15,
          search,
          department: selectedDept,
          rating: selectedRating === '' ? undefined : Number(selectedRating),
        }),
      ])

      setAnalytics(analyticsRes || [])
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
  }, [page, selectedDept, selectedRating])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    void fetchData()
  }

  // Calculate overall metrics
  const totalFeedbackCount = analytics.reduce((acc, curr) => acc + curr.totalFeedback, 0)
  const overallAvgRating =
    totalFeedbackCount > 0
      ? (
          analytics.reduce((acc, curr) => acc + curr.avgRating * curr.totalFeedback, 0) /
          totalFeedbackCount
        ).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            Analyze customer satisfaction ratings, department-wise scores, and ticket feedback.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchData()}
          disabled={loading}
          className="self-start sm:self-auto font-bold cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </Button>
      </div>

      {/* ── Top Overview Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ThumbsUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">
              Departments Covered
            </p>
            <span className="text-2xl font-black text-[var(--ink)]">{analytics.length}</span>
          </div>
        </div>
      </div>

      {/* ── Department-Wise Feedback Analytics Section ────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Building2 size={20} className="text-[var(--primary-blue)]" />
            Department-Wise Feedback Breakdown
          </h2>
        </div>

        {analytics.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8 text-center text-sm text-[var(--ink-muted)]">
            No department feedback submissions recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analytics.map((dept) => (
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

                  {/* 1-5 Star Bar Progress Distribution */}
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

          {/* Search and Filters */}
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
                placeholder="Search ticket code, name, comment..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] w-48 sm:w-64"
              />
            </div>

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
