import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { Badge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
import { departmentService } from '../../services/departmentService'
import { userService } from '../../services/userService'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, formatLabel } from '../../lib/utils'
import type { Department, Role, User } from '../../types'
import { getId, getName } from '../../types'

interface UserForm {
  name: string
  email: string
  password: string
  role: 'manager' | 'employee'
  department: string
  phone: string
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  phone: '',
}

export function AdminUsers() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [deptFilter, setDeptFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userData, deptData] = await Promise.all([
        userService.list({
          page,
          limit: 20,
          role: roleFilter || undefined,
          department: deptFilter || undefined,
          search: debouncedSearch || undefined,
        }),
        departmentService.listAll(),
      ])
      setUsers(userData.items)
      setPages(userData.pagination.pages)
      setTotal(userData.pagination.total)
      setDepartments(deptData)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load users'))
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, deptFilter, debouncedSearch, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [roleFilter, deptFilter, debouncedSearch])

  const save = async () => {
    setSaving(true)
    try {
      await userService.create({
        ...form,
        phone: form.phone || undefined,
      })
      toast.success('User created')
      setOpen(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: User) => {
    try {
      await userService.updateStatus(getId(user), !user.isActive)
      toast.success(user.isActive ? 'User deactivated' : 'User activated')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create managers and employees, filter by role or department."
        actions={
          <Button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setOpen(true)
            }}
          >
            Create user
          </Button>
        }
      />

      <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
            placeholder="Name or email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Department</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={getId(d)} value={getId(d)}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="panel overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={getId(u)} className="border-b border-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">{formatLabel(u.role)}</td>
                    <td className="px-4 py-3">{getName(u.department, '—')}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleActive(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create user">
        <div className="space-y-3">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="field"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="field"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="field"
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as 'manager' | 'employee' }))
              }
              className="field"
            >
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </Field>
          <Field label="Department">
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="field"
            >
              <option value="">Select department</option>
              {departments
                .filter((d) => d.isActive !== false)
                .map((d) => (
                  <option key={getId(d)} value={getId(d)}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="field"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              onClick={() => void save()}
              disabled={!form.name || !form.email || !form.password || !form.department}
            >
              Create
            </Button>
          </div>
        </div>
        <style>{`
          .field {
            width: 100%;
            height: 2.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
            padding: 0 0.75rem;
            outline: none;
          }
          .field:focus { border-color: #0d9488; }
        `}</style>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
    </label>
  )
}
