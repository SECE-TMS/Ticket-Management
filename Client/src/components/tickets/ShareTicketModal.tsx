import { useState } from 'react'
import { Building2, Check, Copy, ExternalLink, FileText, Mail, MessageCircle, Phone, Share2, Tag, User, X } from 'lucide-react'
import { Button } from '../common/Button'
import { useToast } from '../../context/ToastContext'

interface ShareTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticketCode: string
  mobile?: string
  departmentName?: string
  complaintType?: string
  requesterName?: string
  title?: string
  status?: string
}

export function ShareTicketModal({
  isOpen,
  onClose,
  ticketCode,
  mobile = '',
  departmentName = 'General',
  complaintType = 'Maintenance',
  requesterName = '',
  title = '',
  status = '',
}: ShareTicketModalProps) {
  const toast = useToast()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedDetails, setCopiedDetails] = useState(false)

  if (!isOpen) return null

  const origin = window.location.origin
  const trackUrl = `${origin}/track-ticket?ticketCode=${encodeURIComponent(ticketCode)}${mobile ? `&mobile=${encodeURIComponent(mobile)}` : ''}`

  const shareText = [
    `🎫 *TMS Ticket Details*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🔢 *Ticket Code:* ${ticketCode}`,
    title ? `📌 *Title:* ${title}` : null,
    requesterName ? `👤 *Raised By:* ${requesterName}` : null,
    departmentName ? `🏢 *Department:* ${departmentName}` : null,
    complaintType ? `🛠️ *Category:* ${complaintType}` : null,
    status ? `📊 *Status:* ${status.replace(/_/g, ' ').toUpperCase()}` : null,
    `━━━━━━━━━━━━━━━━━━━`,
    `🔗 *Track Ticket Online:*`,
    `${trackUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  const subject = `TMS Ticket #${ticketCode}${title ? ` - ${title}` : ''}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl)
      setCopiedLink(true)
      toast.success('Direct tracking link copied!')
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopiedDetails(true)
      toast.success('Full ticket details copied to clipboard!')
      setTimeout(() => setCopiedDetails(false), 2500)
    } catch {
      toast.error('Failed to copy ticket details')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticketCode)
      setCopiedCode(true)
      toast.success('Ticket code copied!')
      setTimeout(() => setCopiedCode(false), 2500)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: shareText,
          url: trackUrl,
        })
      } catch {
        // Ignored if user canceled
      }
    } else {
      void handleCopyDetails()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">Share Ticket Details</h3>
              <p className="text-xs text-[var(--ink-muted)]">Code: <span className="font-mono font-bold text-[var(--ink)]">{ticketCode}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket Summary Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-2.5">
          {title && (
            <div className="flex items-start gap-2">
              <FileText size={15} className="text-[var(--primary-blue)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ticket Title</span>
                <p className="text-sm font-bold text-slate-900 leading-snug">{title}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {requesterName && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-indigo-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Raised By</span>
                  <p className="text-xs font-bold text-slate-800 truncate">{requesterName}</p>
                </div>
              </div>
            )}

            {departmentName && (
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Department</span>
                  <p className="text-xs font-bold text-slate-800 truncate">{departmentName}</p>
                </div>
              </div>
            )}

            {complaintType && (
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                  <p className="text-xs font-bold text-slate-800 truncate">{complaintType}</p>
                </div>
              </div>
            )}

            {mobile && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-sky-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Contact</span>
                  <p className="text-xs font-bold text-slate-800 truncate">{mobile}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons List */}
        <div className="space-y-2.5">
          {/* WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3.5 hover:bg-emerald-100/90 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <MessageCircle size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-950">Share via WhatsApp</p>
                <p className="text-[11px] text-emerald-700">Sends raised person, department, title &amp; direct link</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          {/* Copy Full Details Button */}
          <button
            type="button"
            onClick={() => void handleCopyDetails()}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 hover:bg-[var(--primary-blue-light)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-blue)] text-white shadow-xs">
                <Copy size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--ink)]">
                  {copiedDetails ? 'Details Copied!' : 'Copy Full Ticket Summary'}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">Includes name, dept, title &amp; tracking link</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--primary-blue)] flex items-center gap-1 shrink-0">
              {copiedDetails ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                'Copy Details'
              )}
            </span>
          </button>

          {/* Copy Direct Track Link */}
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
                <Copy size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">
                  {copiedLink ? 'Link Copied!' : 'Copy Direct Tracking Link'}
                </p>
                <p className="text-[11px] text-slate-500">Auto-fills ticket code and mobile</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 flex items-center gap-1 shrink-0">
              {copiedLink ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                'Copy Link'
              )}
            </span>
          </button>

          {/* Copy Ticket Code Only */}
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Copy size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">
                  {copiedCode ? 'Code Copied!' : 'Copy Ticket Code Only'}
                </p>
                <p className="text-[11px] text-slate-500">{ticketCode}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0">
              {copiedCode ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                'Copy Code'
              )}
            </span>
          </button>

          {/* Email Share */}
          <a
            href={mailtoUrl}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-white shadow-xs">
                <Mail size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Share via Email</p>
                <p className="text-[11px] text-slate-500">Open default mail app with prefilled body</p>
              </div>
            </div>
            <ExternalLink size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          {/* Native Web Share API if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void handleNativeShare()}
              className="w-full justify-center font-bold gap-2 text-xs"
            >
              <Share2 size={15} /> Native Device Share
            </Button>
          )}
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  )
}
