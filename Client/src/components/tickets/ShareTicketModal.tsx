import { useState } from 'react'
import { Copy, ExternalLink, Mail, MessageCircle, Share2, X } from 'lucide-react'
import { Button } from '../common/Button'
import { useToast } from '../../context/ToastContext'

interface ShareTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticketCode: string
  mobile?: string
  departmentName?: string
  complaintType?: string
}

export function ShareTicketModal({
  isOpen,
  onClose,
  ticketCode,
  mobile = '',
  departmentName = 'General',
  complaintType = 'Maintenance',
}: ShareTicketModalProps) {
  const toast = useToast()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  const origin = window.location.origin
  const trackUrl = `${origin}/track-ticket?ticketCode=${encodeURIComponent(ticketCode)}&mobile=${encodeURIComponent(mobile)}`

  const shareText = `*TMS Ticket Raised:* ${ticketCode}\n*Department:* ${departmentName}\n*Issue:* ${complaintType}\nTrack online here: ${trackUrl}`

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(`TMS Ticket #${ticketCode}`)}&body=${encodeURIComponent(shareText)}`

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
          title: `TMS Ticket #${ticketCode}`,
          text: `Track ticket #${ticketCode} (${complaintType})`,
          url: trackUrl,
        })
      } catch (err) {
        // Ignored if user canceled
      }
    } else {
      void handleCopyLink()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">Share Ticket Details</h3>
              <p className="text-xs text-[var(--ink-muted)]">Ticket Code: {ticketCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons List */}
        <div className="space-y-3">
          {/* WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 hover:bg-emerald-100/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <MessageCircle size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900">Share via WhatsApp</p>
                <p className="text-[11px] text-emerald-700">Send direct link &amp; code to contacts</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Copy Direct Track Link */}
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 hover:bg-[var(--primary-blue-light)] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-blue)] text-white shadow-xs">
                <Copy size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--ink)]">
                  {copiedLink ? 'Link Copied!' : 'Copy Direct Tracking Link'}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">Auto-fills ticket code &amp; mobile</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--primary-blue)]">
              {copiedLink ? 'Copied ✓' : 'Copy Link'}
            </span>
          </button>

          {/* Copy Ticket Code Only */}
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Copy size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">
                  {copiedCode ? 'Code Copied!' : 'Copy Ticket Code Only'}
                </p>
                <p className="text-[11px] text-slate-500">{ticketCode}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {copiedCode ? 'Copied ✓' : 'Copy Code'}
            </span>
          </button>

          {/* Email Share */}
          <a
            href={mailtoUrl}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 text-white shadow-xs">
                <Mail size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Share via Email</p>
                <p className="text-[11px] text-slate-500">Open default mail app</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Native Web Share API if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void handleNativeShare()}
              className="w-full justify-center font-bold"
            >
              <Share2 size={16} /> Native Device Share
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
