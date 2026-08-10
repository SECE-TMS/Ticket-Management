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

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
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
      toast.success('User created successfully')
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
    <div className="animate-fade-in">
      <PageHeader
        title="Users"
        description="Create managers and employees, filter by role or department."
        actions={
          <Button
            type="button"
            id="create-user-btn"
            onClick={() => {
              setForm(emptyForm)
              setOpen(true)
            }}
          >
            + Create User
          </Button>
        }
      />

      {/* Filters */}
      <div className="panel mb-5 grid gap-3 p-4 sm:grid-cols-3">
        <div className="form-field">
          <label htmlFor="user-search" className="form-label">Search</label>
          <input
            id="user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            placeholder="Name or email…"
          />
        </div>
        <div className="form-field">
          <label htmlFor="user-role-filter" className="form-label">Role</label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            className="input-field"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="user-dept-filter" className="form-label">Department</label>
          <select
            id="user-dept-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={getId(d)} value={getId(d)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="panel overflow-x-auto">
            <table className="data-table" id="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={getId(u)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="avatar"
                          style={{
                            background: u.isActive ? 'var(--primary-blue-light)' : 'var(--surface-2)',
                            color: u.isActive ? 'var(--primary-blue)' : 'var(--ink-muted)',
                          }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                            {u.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}
                      >
                        {formatLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-muted)' }}>{getName(u.department, '—')}</td>
                    <td>
                      <Badge
                        className={
                          u.isActive
                            ? 'status-resolved'
                            : 'status-closed'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <Button
                          type="button"
                          size="sm"
                          variant={u.isActive ? 'outline' : 'primary'}
                          onClick={() => void toggleActive(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <p className="empty-state-desc">No users match your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Create user modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create User">
        <div className="space-y-4">
          <Field label="Full name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="John Smith"
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="john@company.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input-field"
              placeholder="Minimum 8 characters"
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as 'manager' | 'employee' }))
              }
              className="input-field"
            >
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </Field>
          <Field label="Department">
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="input-field"
            >
              <option value="">Select department…</option>
              {departments
                .filter((d) => d.isActive !== false)
                .map((d) => (
                  <option key={getId(d)} value={getId(d)}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Phone (optional)">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-field"
              placeholder="10-digit number"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              onClick={() => void save()}
              disabled={!form.name || !form.email || !form.password || !form.department}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
