import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle, Mail, Save, Smartphone } from 'lucide-react'
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
        setSettings(data)
        setInitialSettings(data)
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

  const handleSelectMode = <K extends 'mobileMode' | 'emailMode'>(key: K, val: SystemSettings[K]) => {
    if (!settings) return
    const updated = { ...settings, [key]: val }
    if (key === 'mobileMode') {
      updated.smsOtpEnabled = val === 'otp_required'
    }
    if (key === 'emailMode') {
      updated.requireRequesterEmail = val === 'required' || val === 'otp_required'
      updated.emailOtpEnabled = val === 'otp_required'
    }
    setSettings(updated)
  }

  const handleToggle = (key: keyof Omit<SystemSettings, 'notifyEvents' | 'mobileMode' | 'emailMode'>) => {
    if (!settings) return
    setSettings({
      ...settings,
      [key]: !settings[key],
    })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure Mobile/SMS rules, Email field requirements, and Action notification behavior."
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mobile & SMS Verification Controls */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">Notification Triggers</h2>
            <p className="text-xs text-[var(--ink-muted)]">Select specific events that dispatch emails to requesters</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'created', label: 'Ticket Created', desc: 'When ticket is first raised' },
            { key: 'assigned', label: 'Ticket Assigned', desc: 'When assigned to staff' },
            { key: 'statusChanged', label: 'Status Changed', desc: 'Accepted or In Progress' },
            { key: 'resolved', label: 'Ticket Resolved', desc: 'When issue is resolved' },
            { key: 'closed', label: 'Ticket Closed', desc: 'When ticket is completed' },
            { key: 'reopened', label: 'Ticket Reopened', desc: 'When reopened by manager' },
            { key: 'commented', label: 'Comment Added', desc: 'When staff adds a comment' },
          ].map((item) => {
            const k = item.key as keyof SystemSettings['notifyEvents']
            const active = settings.notifyEvents[k]
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
