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
import { PasswordInput } from '../../components/common/PasswordInput'
import { validatePassword } from '../../utils/passwordValidator'
import type { Department, Role, User } from '../../types'
import { getId, getName } from '../../types'

interface UserForm {
  name: string
  email: string
  password: string
  role: 'manager' | 'employee'
  department: string
  phone: string
  rollNumber: string
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  phone: '',
  rollNumber: '',
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--ink)]">{label}</label>
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
  const [limit, setLimit] = useState(10)
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [deptFilter, setDeptFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
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
          limit,
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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role === 'admin' ? 'manager' : u.role,
      department: getId(u.department),
      phone: u.phone || '',
      rollNumber: u.rollNumber || '',
    })
    setOpen(true)
  }

  const isPasswordValid = editing
    ? !form.password || validatePassword(form.password).isValid
    : validatePassword(form.password).isValid

  const save = async () => {
    if (!isPasswordValid) {
      toast.error('Password must meet all complexity requirements')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
          phone: form.phone || '',
          rollNumber: form.rollNumber || '',
        }
        if (form.password) {
          payload.password = form.password
        }
        await userService.update(getId(editing), payload as Parameters<typeof userService.update>[1])
        toast.success('User updated successfully')
      } else {
        await userService.create({
          ...form,
          phone: form.phone || undefined,
          rollNumber: form.rollNumber || undefined,
        })
        toast.success('User created successfully')
      }
      setOpen(false)
      setEditing(null)
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

  const inputClass =
    'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20'

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create managers and employees, filter by role or department."
        actions={
          <Button
            type="button"
            id="create-user-btn"
            onClick={openCreate}
          >
            + Create User
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-search" className="text-sm font-semibold text-[var(--ink)]">Search</label>
          <input
            id="user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
            placeholder="Name or email…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role-filter" className="text-sm font-semibold text-[var(--ink)]">Role</label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            className={`cursor-pointer ${inputClass}`}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-dept-filter" className="text-sm font-semibold text-[var(--ink)]">Department</label>
          <select
            id="user-dept-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={`cursor-pointer ${inputClass}`}
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
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
            <table className="w-full text-left text-sm border-collapse" id="users-table">
              <thead>
                <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 first:rounded-tl-xl">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 last:rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u) => (
                  <tr key={getId(u)} className="transition-colors hover:bg-[var(--primary-blue-light)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase shrink-0 ${u.isActive
                              ? 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]'
                              : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                            }`}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--ink)]">
                            {u.name}
                          </p>
                          <p className="text-xs text-[var(--ink-muted)]">
                            {u.email} {u.rollNumber ? `• ID: ${u.rollNumber}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-muted)]">
                        {formatLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--ink-muted)]">{getName(u.department, '—')}</td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className={
                          u.isActive
                            ? 'bg-[var(--success-light)] text-[var(--success)]'
                            : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </Button>
                        {u.role !== 'admin' && (
                          <Button
                            type="button"
                            size="sm"
                            variant={u.isActive ? 'ghost' : 'primary'}
                            onClick={() => void toggleActive(u)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                      No users match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
            />
          </div>
        </>
      )}

      {/* Create / Edit user modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? `Edit User: ${editing.name}` : 'Create User'}
      >
        <div className="space-y-4">
          <Field label="Full name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="John Smith"
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="john@sece.ac.in"
            />
          </Field>
          <div>
            <PasswordInput
              label={editing ? 'New Password (optional)' : 'Password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editing ? 'Enter new password if changing...' : 'Minimum 8 characters'}
              showStrengthMeter={Boolean(form.password)}
              showValidationRules={Boolean(form.password)}
              error={
                form.password && !validatePassword(form.password).isValid
                  ? 'Password must meet all complexity requirements below'
                  : undefined
              }
            />
          </div>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as 'manager' | 'employee' }))
              }
              className={`cursor-pointer ${inputClass}`}
            >
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </Field>
          <Field label="Department">
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className={`cursor-pointer ${inputClass}`}
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
              className={inputClass}
              placeholder="10-digit number"
            />
          </Field>
          <Field label="Roll Number / Staff ID (optional)">
            <input
              value={form.rollNumber}
              onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))}
              className={inputClass}
              placeholder="  STF-2026-001"
            />
          </Field>

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
              onClick={() => void save()}
              disabled={!form.name || !form.email || !form.department || !isPasswordValid || (!editing && !form.password)}
            >
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
