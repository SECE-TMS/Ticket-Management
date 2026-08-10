import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { Badge } from '../../components/common/Badge'
import { userService } from '../../services/userService'
import { useAppSelector } from '../../store/hooks'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { User } from '../../types'
import { getId } from '../../types'

interface EmpForm {
  name: string
  email: string
  password: string
  phone: string
}

const emptyForm: EmpForm = { name: '', email: '', password: '', phone: '' }

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function ManagerEmployees() {
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const deptId = getId(user?.department)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EmpForm>(emptyForm)

  const load = useCallback(async () => {
    if (!deptId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const users = await userService.listByDepartment(deptId)
      setEmployees(users.filter((u) => u.role === 'employee'))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load employees'))
    } finally {
      setLoading(false)
    }
  }, [deptId, toast])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await userService.createEmployee({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      })
      toast.success('Employee created')
      setOpen(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!deptId) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-10 text-center shadow-xs">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
            <Users size={22} />
          </div>
          <p className="text-base font-bold text-[var(--ink)]">No department assigned</p>
          <p className="max-w-xs text-sm text-[var(--ink-muted)]">Your account has no department assigned. Contact an admin to fix this.</p>
        </div>
      </div>
    )
  }

  if (loading) return <PageLoader />

  const inputClass =
    'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20'

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage technicians in your department."
        actions={
          <Button
            type="button"
            id="add-employee-btn"
            onClick={() => {
              setForm(emptyForm)
              setOpen(true)
            }}
          >
            + Add Employee
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <table className="w-full text-left text-sm border-collapse" id="employees-table">
          <thead>
            <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3 first:rounded-tl-xl">Employee</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 last:rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {employees.map((e) => (
              <tr key={getId(e)} className="transition-colors hover:bg-[var(--primary-blue-light)]">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase shrink-0 ${
                        e.isActive
                          ? 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]'
                          : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                      }`}
                    >
                      {getInitials(e.name)}
                    </div>
                    <p className="font-semibold text-sm text-[var(--ink)]">
                      {e.name}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[var(--ink-muted)]">{e.email}</td>
                <td className="px-4 py-3.5 text-[var(--ink-muted)]">{e.phone || '—'}</td>
                <td className="px-4 py-3.5">
                  <Badge
                    className={
                      e.isActive
                        ? 'bg-[var(--success-light)] text-[var(--success)]'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {e.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
            {!employees.length && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                  No employees yet. Add your first technician to start assigning tickets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee" size="sm">
        <div className="space-y-4">
          {(
            [
              ['name', 'Full name', 'text', 'John Smith'],
              ['email', 'Email address', 'email', 'john@company.com'],
              ['password', 'Password', 'password', 'Minimum 8 characters'],
              ['phone', 'Phone (optional)', 'text', '9876543210'],
            ] as const
          ).map(([key, label, type, placeholder]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`emp-${key}`} className="text-sm font-semibold text-[var(--ink)]">{label}</label>
              <input
                id={`emp-${key}`}
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={inputClass}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              disabled={!form.name || !form.email || !form.password}
              onClick={() => void save()}
            >
              Create Employee
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
