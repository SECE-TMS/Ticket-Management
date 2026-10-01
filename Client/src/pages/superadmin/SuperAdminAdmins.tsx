import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'
import { superadminService } from '../../services/superadminService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { User } from '../../types'

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

interface AdminFormState {
  name: string
  email: string
  password: string
  phone: string
}

interface ResetPasswordState {
  adminId: string
  adminName: string
  newPassword: string
  confirmPassword: string
  showPassword: boolean
}

export function SuperAdminAdmins() {
  const toast = useToast()
  const [admins, setAdmins] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<string>('')

  // Create admin modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<AdminFormState>({ name: '', email: '', password: '', phone: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)

  // Edit admin modal
  const [editAdmin, setEditAdmin] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Reset password state
  const [resetPwd, setResetPwd] = useState<ResetPasswordState | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const res = await superadminService.listAdmins({
        page,
        limit: 20,
        search: search || undefined,
        isActive: filterActive || undefined,
      })
      setAdmins(res.items)
      setPagination(res.pagination)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load admins'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [search, filterActive])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Please fill in all required fields')
      return
    }
    setCreateLoading(true)
    try {
      await superadminService.createAdmin(createForm)
      toast.success('Admin created successfully')
      setCreateOpen(false)
      setCreateForm({ name: '', email: '', password: '', phone: '' })
      void load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create admin'))
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAdmin) return
    setEditLoading(true)
    try {
      await superadminService.updateAdmin(editAdmin.id, editForm)
      toast.success('Admin updated successfully')
      setEditAdmin(null)
      void load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update admin'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleStatus = async (admin: User) => {
    try {
      await superadminService.toggleAdminStatus(admin.id, !admin.isActive)
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`)
      void load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to toggle admin status'))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPwd) return
    if (resetPwd.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (resetPwd.newPassword !== resetPwd.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setResetLoading(true)
    try {
      await superadminService.resetAdminPassword(resetPwd.adminId, resetPwd.newPassword)
      toast.success('Password reset successfully. Admin will be prompted to change it on next login.')
      setResetPwd(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reset password'))
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-purple-light)]">
            <ShieldCheck size={22} className="text-[var(--primary-purple)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)]">Manage Admins</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              {pagination.total} admin account{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button id="sa-admins-refresh" type="button" onClick={() => void load()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            id="sa-admins-create"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={15} />
            New Admin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            placeholder="Search admins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary-blue)]"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Admins Grid */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admins.length === 0 && (
            <div className="col-span-full rounded-2xl border border-[var(--border)] bg-[var(--white)] p-10 text-center">
              <ShieldOff size={36} className="mx-auto mb-3 text-[var(--ink-muted)]" />
              <p className="font-semibold text-[var(--ink)]">No admins found</p>
              <p className="text-sm text-[var(--ink-muted)]">Create the first admin account</p>
            </div>
          )}
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs"
            >
              {/* Admin avatar + info */}
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-purple)] text-sm font-bold text-white shadow-sm">
                  {getInitials(admin.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--ink)]">{admin.name}</p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">{admin.email}</p>
                  {admin.phone && (
                    <p className="text-xs text-[var(--ink-muted)]">{admin.phone}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      admin.isActive
                        ? 'bg-[var(--success-light)] text-[var(--success)]'
                        : 'bg-[var(--danger-light)] text-[var(--danger)]'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {admin.lastLogin && (
                    <p className="text-[10px] text-[var(--ink-muted)]">
                      Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  id={`sa-edit-admin-${admin.id}`}
                  onClick={() => {
                    setEditAdmin(admin)
                    setEditForm({ name: admin.name, phone: admin.phone || '' })
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--primary-blue-light)] hover:text-[var(--primary-blue)] transition-colors cursor-pointer"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  id={`sa-toggle-admin-${admin.id}`}
                  onClick={() => void handleToggleStatus(admin)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    admin.isActive
                      ? 'border-[var(--danger-light)] bg-[var(--danger-light)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white'
                      : 'border-[var(--success-light)] bg-[var(--success-light)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white'
                  }`}
                >
                  {admin.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                  {admin.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  id={`sa-reset-pwd-admin-${admin.id}`}
                  onClick={() =>
                    setResetPwd({
                      adminId: admin.id,
                      adminName: admin.name,
                      newPassword: '',
                      confirmPassword: '',
                      showPassword: false,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <KeyRound size={12} />
                  Reset Pwd
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void load(p)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                p === pagination.page
                  ? 'bg-[var(--primary-blue)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--primary-blue-light)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── CREATE ADMIN MODAL ─────────────────────────────────────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-blue-light)]">
                <Plus size={18} className="text-[var(--primary-blue)]" />
              </div>
              <h2 className="text-base font-bold text-[var(--ink)] flex-1">Create New Admin</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="cursor-pointer text-[var(--ink-muted)] hover:text-[var(--ink)]"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => void handleCreate(e)} className="p-5 space-y-4">
              {['name', 'email', 'phone'].map((field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    {field.charAt(0).toUpperCase() + field.slice(1)} {field !== 'phone' && <span className="text-[var(--danger)]">*</span>}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={(createForm as unknown as Record<string, string>)[field] || ''}
                    onChange={(e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${field}`}
                    required={field !== 'phone'}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Password <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3.5 pr-10 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                  <button type="button" onClick={() => setShowCreatePassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] cursor-pointer">
                    {showCreatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer">Cancel</button>
                <Button type="submit" id="sa-create-admin-submit" loading={createLoading} className="flex-1">Create Admin</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ADMIN MODAL ──────────────────────────────────────────────────── */}
      {editAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditAdmin(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-blue-light)]">
                <Pencil size={16} className="text-[var(--primary-blue)]" />
              </div>
              <h2 className="text-base font-bold text-[var(--ink)] flex-1">Edit Admin</h2>
              <button type="button" onClick={() => setEditAdmin(null)} className="cursor-pointer text-[var(--ink-muted)] hover:text-[var(--ink)]"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => void handleEdit(e)} className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Optional" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditAdmin(null)} className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer">Cancel</button>
                <Button type="submit" id="sa-edit-admin-submit" loading={editLoading} className="flex-1">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ─────────────────────────────────────────────── */}
      {resetPwd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResetPwd(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <KeyRound size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-[var(--ink)]">Reset Password</h2>
                <p className="text-xs text-[var(--ink-muted)]">For: {resetPwd.adminName}</p>
              </div>
              <button type="button" onClick={() => setResetPwd(null)} className="cursor-pointer text-[var(--ink-muted)] hover:text-[var(--ink)]"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => void handleResetPassword(e)} className="p-5 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                ⚠️ The admin will be required to change their password upon next login.
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">New Password</label>
                <div className="relative">
                  <input
                    type={resetPwd.showPassword ? 'text' : 'password'}
                    value={resetPwd.newPassword}
                    onChange={(e) => setResetPwd((s) => s ? { ...s, newPassword: e.target.value } : s)}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3.5 pr-10 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                  <button type="button" onClick={() => setResetPwd((s) => s ? { ...s, showPassword: !s.showPassword } : s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] cursor-pointer">
                    {resetPwd.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Confirm Password</label>
                <input
                  type={resetPwd.showPassword ? 'text' : 'password'}
                  value={resetPwd.confirmPassword}
                  onChange={(e) => setResetPwd((s) => s ? { ...s, confirmPassword: e.target.value } : s)}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3.5 pr-10 text-sm outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                />
                {resetPwd.confirmPassword && resetPwd.newPassword !== resetPwd.confirmPassword && (
                  <p className="mt-1 text-xs text-[var(--danger)]">Passwords do not match</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setResetPwd(null)} className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer">Cancel</button>
                <Button type="submit" id="sa-reset-pwd-submit" loading={resetLoading} className="flex-1">Reset Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
