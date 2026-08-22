import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { PRIORITIES, formatLabel } from '../../lib/utils'
import type { TicketPriority, User } from '../../types'
import { getId } from '../../types'

interface AssignModalProps {
  open: boolean
  onClose: () => void
  employees: User[]
  expectedResolutionAt?: string | null
  loading?: boolean
  onSubmit: (payload: { assignedTo: string; priority: TicketPriority }) => Promise<void>
  initialPriority?: TicketPriority
}

export function AssignModal({
  open,
  onClose,
  employees,
  expectedResolutionAt,
  loading,
  onSubmit,
  initialPriority = 'medium',
}: AssignModalProps) {
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TicketPriority>(initialPriority)

  useEffect(() => {
    if (open) {
      setAssignedTo('')
      setPriority(initialPriority)
    }
  }, [open, initialPriority])

  return (
    <Modal open={open} onClose={onClose} title="Assign Ticket" size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!assignedTo) return
          void onSubmit({ assignedTo, priority })
        }}
      >
        {/* Employee select */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assign-employee" className="text-sm font-semibold text-[var(--ink)]">
            Employee
          </label>
          <select
            id="assign-employee"
            required
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            <option value="">Select employee…</option>
            {employees.map((emp) => (
              <option key={getId(emp)} value={getId(emp)}>
                {emp.name} · {emp.email}
              </option>
            ))}
          </select>
          {!employees.length && (
            <p className="text-xs text-[var(--danger)] mt-1">
              No active employees in this department.
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assign-priority" className="text-sm font-semibold text-[var(--ink)]">
            Priority
          </label>
          <select
            id="assign-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatLabel(p)}
              </option>
            ))}
          </select>
        </div>

        {/* SLA info card */}
        <div className="rounded-xl border border-[var(--primary-blue-muted)] bg-[var(--primary-blue-light)] p-3.5 text-sm">
          <p className="font-bold text-[var(--primary-blue)]">
            Expected resolution
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {expectedResolutionAt
              ? new Date(expectedResolutionAt).toLocaleString()
              : 'Based on department SLA after creation'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!assignedTo}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  )
}
