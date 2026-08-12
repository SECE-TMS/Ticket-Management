import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pages: number
  total: number
  limit?: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50, 100],
}: PaginationProps) {
  const currentLimit = limit || 10
  const startItem = total === 0 ? 0 : (page - 1) * currentLimit + 1
  const endItem = Math.min(page * currentLimit, total)

  // Build page number list with ellipsis
  const pageNums: (number | '…')[] = []
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) pageNums.push(i)
  } else {
    pageNums.push(1)
    if (page > 3) pageNums.push('…')
    const start = Math.max(2, page - 1)
    const end = Math.min(pages - 1, page + 1)
    for (let i = start; i <= end; i++) pageNums.push(i)
    if (page < pages - 2) pageNums.push('…')
    pageNums.push(pages)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--white)] px-4 py-3 shadow-xs text-xs text-[var(--ink-muted)]">
      {/* Left: Summary text */}
      <div className="flex items-center gap-3">
        <p className="text-xs">
          Showing <strong className="text-[var(--ink)]">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-[var(--ink)]">{total}</strong> items
        </p>

        {/* Page Limit Selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-3">
            <span>Per page:</span>
            <select
              value={currentLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-[var(--border)] bg-[var(--white)] px-2 text-xs font-semibold text-[var(--ink)] outline-none cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-2">
        <span className="mr-1 hidden sm:inline">
          Page <strong className="text-[var(--ink)]">{page}</strong> of{' '}
          <strong className="text-[var(--ink)]">{Math.max(1, pages)}</strong>
        </span>

        <nav className="pagination" aria-label="Pagination">
          {/* Prev Button */}
          <button
            type="button"
            className="page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          {pages > 1 &&
            pageNums.map((p, idx) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="page-btn"
                  style={{ border: 'none', cursor: 'default', opacity: 0.4 }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPageChange(p as number)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

          {/* Next Button */}
          <button
            type="button"
            className="page-btn"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </nav>
      </div>
    </div>
  )
}
