import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) {
    return (
      <p className="text-sm text-slate-500">
        {total} result{total === 1 ? '' : 's'}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
