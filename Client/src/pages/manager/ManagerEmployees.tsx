import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { Badge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
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
  rollNumber: string
}

const emptyForm: EmpForm = { name: '', email: '', password: '', phone: '', rollNumber: '' }

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
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (emp: User) => {
    setEditing(emp)
    setForm({
      name: emp.name,
      email: emp.email,
      password: '',
      phone: emp.phone || '',
      rollNumber: emp.rollNumber || '',
    })
    setOpen(true)
  }

  const toggleActive = async (emp: User) => {
    try {
      await userService.updateStatus(getId(emp), !emp.isActive)
      toast.success(emp.isActive ? 'Employee deactivated' : 'Employee activated')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone || '',
          rollNumber: form.rollNumber || '',
        }
        if (form.password) {
          payload.password = form.password
        }
        await userService.update(getId(editing), payload as Parameters<typeof userService.update>[1])
        toast.success('Employee details updated successfully')
      } else {
        await userService.createEmployee({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          rollNumber: form.rollNumber || undefined,
        })
        toast.success('Employee created successfully')
      }
      setOpen(false)
      setForm(emptyForm)
      setEditing(null)
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
        description="Manage technicians and staff in your department."
        actions={
          <Button type="button" id="add-employee-btn" onClick={openCreate}>
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 last:rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {employees
              .slice((page - 1) * limit, page * limit)
              .map((e) => (
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
                  <td className="px-4 py-3.5 text-[var(--ink-muted)]">
                    {e.email} {e.rollNumber ? `• ID: ${e.rollNumber}` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--ink-muted)]">{e.phone || '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge
                      className={
                        e.isActive
                          ? 'bg-[var(--success-light)] text-[var(--success)]'
                          : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                      }
                    >
                      {e.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(e)}
                      >
                        Edit Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={e.isActive ? 'ghost' : 'primary'}
                        onClick={() => void toggleActive(e)}
                      >
                        {e.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            {!employees.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                  No employees yet. Add your first technician to start assigning tickets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {employees.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            pages={Math.max(1, Math.ceil(employees.length / limit))}
            total={employees.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? `Edit Employee: ${editing.name}` : 'Add Employee'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-name" className="text-sm font-semibold text-[var(--ink)]">
              Full Name
            </label>
            <input
              id="emp-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Rahul "
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-email" className="text-sm font-semibold text-[var(--ink)]">
              Email Address
            </label>
            <input
              id="emp-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="e.g. rahul@isaii.in"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-phone" className="text-sm font-semibold text-[var(--ink)]">
              Phone Number
            </label>
            <input
              id="emp-phone"
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
              placeholder="10-digit mobile"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-rollNumber" className="text-sm font-semibold text-[var(--ink)]">
              Roll Number / Staff ID (optional)
            </label>
            <input
              id="emp-rollNumber"
              type="text"
              value={form.rollNumber}
              onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))}
              className={inputClass}
              placeholder="e.g. STF-2026-001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-password" className="text-sm font-semibold text-[var(--ink)]">
              {editing ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              id="emp-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClass}
              placeholder={editing ? 'Enter new password if changing...' : 'Minimum 8 characters'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setEditing(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              disabled={!form.name || !form.email || (!editing && !form.password)}
              onClick={() => void save()}
            >
              {editing ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
