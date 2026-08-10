import { useCallback, useEffect, useState } from 'react'
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
      <div className="panel p-8 text-center text-sm text-slate-600">
        Your account has no department assigned. Contact an admin.
      </div>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage technicians in your department."
        actions={
          <Button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setOpen(true)
            }}
          >
            Add employee
          </Button>
        }
      />

      <div className="panel overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={getId(e)} className="border-b border-slate-50">
                <td className="px-4 py-3 font-medium text-navy">{e.name}</td>
                <td className="px-4 py-3">{e.email}</td>
                <td className="px-4 py-3">{e.phone || '—'}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      e.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {e.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
            {!employees.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No employees yet. Add your first technician.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add employee">
        <div className="space-y-3">
          {(
            [
              ['name', 'Name', 'text'],
              ['email', 'Email', 'email'],
              ['password', 'Password', 'password'],
              ['phone', 'Phone', 'text'],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-slate-600">{label}</span>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
              />
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              disabled={!form.name || !form.email || !form.password}
              onClick={() => void save()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
