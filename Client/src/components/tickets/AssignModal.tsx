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
    <Modal open={open} onClose={onClose} title="Assign ticket">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!assignedTo) return
          void onSubmit({ assignedTo, priority })
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Employee</span>
          <select
            required
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={getId(emp)} value={getId(emp)}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg bg-surface px-3 py-2 text-sm text-slate-600">
          <p className="font-medium text-navy">Expected resolution</p>
          <p className="mt-0.5">
            {expectedResolutionAt
              ? new Date(expectedResolutionAt).toLocaleString()
              : 'Based on department SLA after creation'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  )
}
