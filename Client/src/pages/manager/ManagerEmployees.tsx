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
      <div className="panel p-10 text-center">
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={22} /></div>
          <p className="empty-state-title">No department assigned</p>
          <p className="empty-state-desc">Your account has no department assigned. Contact an admin to fix this.</p>
        </div>
      </div>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
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

      <div className="panel overflow-x-auto">
        <table className="data-table" id="employees-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={getId(e)}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="avatar"
                      style={{
                        background: e.isActive ? 'var(--primary-blue-light)' : 'var(--surface-2)',
                        color: e.isActive ? 'var(--primary-blue)' : 'var(--ink-muted)',
                      }}
                    >
                      {getInitials(e.name)}
                    </div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                      {e.name}
                    </p>
                  </div>
                </td>
                <td style={{ color: 'var(--ink-muted)' }}>{e.email}</td>
                <td style={{ color: 'var(--ink-muted)' }}>{e.phone || '—'}</td>
                <td>
                  <Badge className={e.isActive ? 'status-resolved' : 'status-closed'}>
                    {e.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
            {!employees.length && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={22} /></div>
                    <p className="empty-state-title">No employees yet</p>
                    <p className="empty-state-desc">Add your first technician to start assigning tickets.</p>
                  </div>
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
            <div key={key} className="form-field">
              <label htmlFor={`emp-${key}`} className="form-label">{label}</label>
              <input
                id={`emp-${key}`}
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="input-field"
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
