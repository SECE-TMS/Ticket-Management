import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CheckCircle,
  CheckCircle2,
  Clock,
  Mail,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { settingService } from '../../services/settingService'
import { PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { SystemSettings } from '../../types'

export function AdminSettings() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [initialSettings, setInitialSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await settingService.get()
        // Ensure approval default fields exist
        const formatted: SystemSettings = {
          ...data,
          approvalRequired: data.approvalRequired ?? true,
          approvalMode: data.approvalMode || (data.approvalRequired === false ? 'disabled' : 'always'),
          allowRequesterApproval: data.allowRequesterApproval ?? true,
          autoCloseOnApproval: data.autoCloseOnApproval ?? true,
          notifyManagerOnPendingApproval: data.notifyManagerOnPendingApproval ?? true,
          notifyEvents: {
            ...data.notifyEvents,
            approvalRequested: data.notifyEvents?.approvalRequested ?? true,
            approved: data.notifyEvents?.approved ?? true,
          },
        }
        setSettings(formatted)
        setInitialSettings(formatted)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load system settings'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  const hasChanges = useMemo(() => {
    if (!settings || !initialSettings) return false
    return JSON.stringify(settings) !== JSON.stringify(initialSettings)
  }, [settings, initialSettings])

  const handleSelectMode = <K extends 'mobileMode' | 'emailMode' | 'approvalMode'>(
    key: K,
    val: SystemSettings[K]
  ) => {
    if (!settings) return
    const updated = { ...settings, [key]: val }
    if (key === 'mobileMode') {
      updated.smsOtpEnabled = val === 'otp_required'
    }
    if (key === 'emailMode') {
      updated.requireRequesterEmail = val === 'required' || val === 'otp_required'
      updated.emailOtpEnabled = val === 'otp_required'
    }
    if (key === 'approvalMode') {
      updated.approvalRequired = val !== 'disabled'
    }
    setSettings(updated)
  }

  const handleToggle = (
    key: keyof Omit<SystemSettings, 'notifyEvents' | 'mobileMode' | 'emailMode' | 'approvalMode'>
  ) => {
    if (!settings) return
    const nextVal = !settings[key]
    const updated = {
      ...settings,
      [key]: nextVal,
    }
    // If approvalRequired toggled, sync approvalMode
    if (key === 'approvalRequired') {
      updated.approvalMode = nextVal ? 'always' : 'disabled'
    }
    setSettings(updated)
  }

  const handleEventToggle = (eventKey: keyof SystemSettings['notifyEvents']) => {
    if (!settings) return
    setSettings({
      ...settings,
      notifyEvents: {
        ...settings.notifyEvents,
        [eventKey]: !settings.notifyEvents[eventKey],
      },
    })
  }

  const handleSave = async () => {
    if (!settings || !hasChanges) return
    setSaving(true)
    try {
      const updated = await settingService.update(settings)
      setSettings(updated)
      setInitialSettings(updated)
      toast.success('System settings saved successfully')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (!settings) return null

  const isApprovalActive = settings.approvalRequired && settings.approvalMode !== 'disabled'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="System Settings"
        description="Configure ticket approval governance, verification requirements, notification rules, and communication modes."
        actions={
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges || saving}
            variant="primary"
          >
            <Save size={16} className="mr-1.5" />
            Save Settings
          </Button>
        }
      />

      {/* Ticket Approval & Governance Master Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none rounded-bl-full" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-xs transition-all ${
              isApprovalActive
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--ink)]">Ticket Approval &amp; Quality Governance</h2>
                {/* <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isApprovalActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isApprovalActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  {isApprovalActive ? 'Approval Workflow Active' : 'Direct Resolution (No Approval)'}
                </span> */}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Require Department Managers to review technician resolution remarks &amp; media proofs before tickets can be closed.
              </p>
            </div>
          </div>

          {/* Master Switch Button */}
          <div className="flex items-center gap-3 bg-[var(--surface-2)] px-4 py-2 rounded-xl border border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--ink)]">Approval Method</span>
            <button
              type="button"
              role="switch"
              id="toggle-approval-workflow"
              aria-checked={settings.approvalRequired}
              onClick={() => handleToggle('approvalRequired')}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.approvalRequired ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.approvalRequired ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Approval Policy Selector */}
        <div className="mt-6 space-y-6">
          <div>
            <label className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5 mb-1">
              {/* <Workflow size={16} className="text-[var(--primary-blue)]" /> */}
              Approval Enforcement Policy
            </label>
            {/* <p className="text-xs text-[var(--ink-muted)] mb-3">
              Define which ticket submissions require mandatory manager verification vs direct closing.
            </p> */}

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  id: 'always',
                  title: 'Always Require Approval',
                  badge: 'Recommended',
                  badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                  desc: 'Every ticket completed by staff enters Pending Approval for manager verification of completion proof.',
                  icon: ShieldCheck,
                },
                {
                  id: 'high_priority_only',
                  title: 'High & Urgent Priority Only',
                  badge: 'Selective',
                  badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                  desc: 'Routine tickets resolve directly; only High & Urgent priority tickets require manager sign-off.',
                  icon: ShieldAlert,
                },
                {
                  id: 'disabled',
                  title: 'Direct Resolution (Disabled)',
                  badge: 'Fast Track',
                  badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
                  desc: 'Technicians can directly mark tickets resolved/closed without manager intervention.',
                  icon: CheckCircle2,
                },
              ].map((policy) => {
                const active = settings.approvalMode === policy.id
                const IconComponent = policy.icon
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => handleSelectMode('approvalMode', policy.id as SystemSettings['approvalMode'])}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                      active
                        ? 'border-[var(--primary-blue)] bg-blue-50/70 shadow-sm ring-2 ring-[var(--primary-blue)]/20'
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <div className={`p-2 rounded-lg ${active ? 'bg-[var(--primary-blue)] text-white' : 'bg-gray-100 text-[var(--ink-muted)]'}`}>
                        <IconComponent size={18} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${policy.badgeColor}`}>
                        {policy.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[var(--ink)]">{policy.title}</span>
                    <span className="text-[11px] text-[var(--ink-muted)] leading-relaxed mt-1">{policy.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interactive Visual Workflow Pipeline */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-purple-50/40 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)] flex items-center gap-1.5 mb-3">
              {/* <Sparkles size={14} /> */}
              Active Resolution Pipeline Preview
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-[var(--border)] shadow-2xs w-full md:w-auto flex-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-[var(--ink)]">Staff Resolves</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Attaches completion proof &amp; notes</p>
                </div>
              </div>

              <ArrowRight size={16} className="text-gray-400 shrink-0 hidden md:block" />

              {/* Step 2 */}
              <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border shadow-2xs w-full md:w-auto flex-1 transition-all ${
                isApprovalActive
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-medium'
                  : 'bg-gray-100 border-gray-200 text-gray-400 line-through opacity-60'
              }`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                  isApprovalActive ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-500'
                }`}>
                  <Clock size={13} />
                </div>
                <div>
                  <p className="font-bold">Pending Manager Review</p>
                  <p className="text-[10px]">
                    {isApprovalActive ? 'Manager inspects resolution proof' : 'Skipped in direct mode'}
                  </p>
                </div>
              </div>

              <ArrowRight size={16} className="text-gray-400 shrink-0 hidden md:block" />

              {/* Step 3 */}
              <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-[var(--border)] shadow-2xs w-full md:w-auto flex-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-[var(--ink)]">
                    {settings.autoCloseOnApproval ? 'Closed Officially' : 'Marked Resolved'}
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">Feedback &amp; rating unlocked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Workflow Controls */}
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink)] block">
                  Auto-Close Upon Manager Approval
                </label>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  Directly transition ticket status to Closed when approved.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoCloseOnApproval}
                onClick={() => handleToggle('autoCloseOnApproval')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoCloseOnApproval ? 'bg-[var(--primary-blue)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoCloseOnApproval ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink)] block">
                  Alert Managers on Submission
                </label>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  Send high-priority notification to all department managers.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifyManagerOnPendingApproval}
                onClick={() => handleToggle('notifyManagerOnPendingApproval')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifyManagerOnPendingApproval ? 'bg-[var(--primary-blue)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifyManagerOnPendingApproval ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink)] block">
                  Requester Satisfaction &amp; Rating
                </label>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  Allow ticket requesters to submit 5-star ratings &amp; reviews.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowRequesterApproval}
                onClick={() => handleToggle('allowRequesterApproval')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.allowRequesterApproval ? 'bg-[var(--primary-blue)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.allowRequesterApproval ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mobile & SMS Verification Controls */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Mobile &amp; SMS Configuration</h2>
              <p className="text-xs text-[var(--ink-muted)]">Control mobile field visibility and OTP verification</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-[var(--ink)] block mb-1">
                Mobile Number &amp; OTP Mode in Public Form
              </label>
              <p className="text-xs text-[var(--ink-muted)] mb-3">
                Choose how the Mobile Number field and OTP verification behave when users raise tickets.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'hidden', label: 'Not Needed (Hidden)', desc: 'Hide mobile field & OTP' },
                  { id: 'optional', label: 'Optional', desc: 'Optional input, no OTP' },
                  { id: 'required', label: 'Required (No OTP)', desc: 'Mandatory input, no OTP' },
                  { id: 'otp_required', label: 'Required + SMS OTP', desc: 'Mandatory 2Factor OTP' },
                ].map((opt) => {
                  const active = settings.mobileMode === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectMode('mobileMode', opt.id as SystemSettings['mobileMode'])}
                      className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'border-[var(--primary-blue)] bg-blue-50/60 font-semibold text-[var(--primary-blue)] shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[11px] text-[var(--ink-muted)] font-normal mt-0.5">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Email Field & Notification Controls */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Email Field &amp; Notification Rules</h2>
              <p className="text-xs text-[var(--ink-muted)]">Configure requester email requirements and notification delivery</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-semibold text-[var(--ink)] block mb-1">
                Requester Email Field Mode
              </label>
              <p className="text-xs text-[var(--ink-muted)] mb-3">
                Choose whether the Email field is hidden, optional, or mandatory on the ticket raising form.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'hidden', label: 'Not Needed (Hidden)', desc: 'Hide email field completely' },
                  { id: 'optional', label: 'Optional', desc: 'Optional input for updates' },
                  { id: 'required', label: 'Required (No OTP)', desc: 'Mandatory email input' },
                  { id: 'otp_required', label: 'Required + Email OTP', desc: 'Mandatory 6-digit Email OTP' },
                ].map((opt) => {
                  const active = settings.emailMode === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectMode('emailMode', opt.id as SystemSettings['emailMode'])}
                      className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'border-[var(--primary-blue)] bg-blue-50/60 font-semibold text-[var(--primary-blue)] shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[11px] text-[var(--ink-muted)] font-normal mt-0.5">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block">
                  Master Email Notifications
                </label>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Enable or disable all outbound email dispatches from the system.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.emailNotificationsEnabled}
                onClick={() => handleToggle('emailNotificationsEnabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.emailNotificationsEnabled ? 'bg-[var(--primary-blue)]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block">
                  Notify Requester for Every Ticket Update
                </label>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Send automated emails to requester whenever an action is updated on their ticket.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifyRequesterOnEveryAction}
                onClick={() => handleToggle('notifyRequesterOnEveryAction')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifyRequesterOnEveryAction ? 'bg-[var(--primary-blue)]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifyRequesterOnEveryAction ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block">
                  Enable Ticket Feedback System
                </label>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Allow requesters to submit 1–5 star ratings, satisfaction tags, and remarks for resolved or closed tickets.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.feedbackEnabled ?? true}
                onClick={() => handleToggle('feedbackEnabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.feedbackEnabled ?? true ? 'bg-[var(--primary-blue)]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.feedbackEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Triggers */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">Notification Triggers</h2>
            <p className="text-xs text-[var(--ink-muted)]">Select specific events that dispatch emails to requesters and stakeholders</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'created', label: 'Ticket Created', desc: 'When ticket is first raised' },
            { key: 'assigned', label: 'Ticket Assigned', desc: 'When assigned to staff' },
            { key: 'statusChanged', label: 'Status Changed', desc: 'Accepted or In Progress' },
            { key: 'approvalRequested', label: 'Approval Requested', desc: 'When staff submits work for review' },
            { key: 'approved', label: 'Ticket Approved', desc: 'When manager signs off & closes' },
            { key: 'resolved', label: 'Ticket Resolved', desc: 'When issue is marked resolved' },
            { key: 'closed', label: 'Ticket Closed', desc: 'When ticket lifecycle completes' },
            { key: 'reopened', label: 'Ticket Reopened', desc: 'When reopened by manager for rework' },
            { key: 'commented', label: 'Comment Added', desc: 'When staff or requester posts note' },
          ].map((item) => {
            const k = item.key as keyof SystemSettings['notifyEvents']
            const active = settings.notifyEvents[k] ?? true
            return (
              <div
                key={item.key}
                onClick={() => handleEventToggle(k)}
                className={`flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all ${
                  active
                    ? 'border-[var(--primary-blue)] bg-blue-50/40 shadow-xs'
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:bg-gray-50'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{item.label}</h3>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.desc}</p>
                </div>
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? 'border-[var(--primary-blue)] bg-[var(--primary-blue)] text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {active && <CheckCircle size={14} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
