import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) {
    return (
      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
        {total} result{total === 1 ? '' : 's'}
      </p>
    )
  }

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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
        Page <strong style={{ color: 'var(--ink)' }}>{page}</strong> of{' '}
        <strong style={{ color: 'var(--ink)' }}>{pages}</strong> &middot; {total} total
      </p>

      <nav className="pagination" aria-label="Pagination">
        {/* Prev */}
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
        {pageNums.map((p, idx) =>
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

        {/* Next */}
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
  )
}
