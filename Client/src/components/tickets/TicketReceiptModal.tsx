import { useRef } from 'react'
import { CheckCircle2, Download, Lock, Star, Ticket as TicketIcon, X } from 'lucide-react'
import { Button } from '../common/Button'
import sriEshwarLogo from '../../assets/sri_eshwar_clean.png'
import type { Ticket } from '../../types'
import { format } from 'date-fns'

interface TicketReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  ticket?: Ticket | null
  ticketCode?: string
  mobile?: string
  requesterName?: string
  departmentName?: string
  complaintType?: string
  description?: string
  createdAt?: string
  requireFeedback?: boolean
}

export function TicketReceiptModal({
  isOpen,
  onClose,
  ticket,
  ticketCode = ticket?.ticketCode || 'TMS-2026',
  mobile = ticket?.requester?.mobile || '',
  requesterName = ticket?.requester?.name || 'Valued User',
  departmentName = typeof ticket?.department === 'object' ? ticket.department?.name : 'Department',
  complaintType = ticket?.complaintType || 'Service Request',
  description = ticket?.description || '',
  createdAt = ticket?.createdAt || new Date().toISOString(),
  requireFeedback = true,
}: TicketReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const hasFeedback = Boolean(ticket?.feedback?.rating && ticket.feedback.rating >= 1)
  const isDownloadLocked = requireFeedback && !hasFeedback

  const handleDownloadImage = async () => {
    if (isDownloadLocked) return

    const W = 800
    const H = 1120
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Preload Sri Eshwar logo
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    await new Promise((resolve) => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
      logoImg.src = sriEshwarLogo
    })

    // White background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)

    // Outer Border
    ctx.strokeStyle = '#163A6B'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(24, 24, W - 48, H - 48, 24)
    ctx.stroke()

    // Top Brand Accent Bar
    ctx.fillStyle = '#235EAA'
    ctx.beginPath()
    ctx.roundRect(24, 24, W - 48, 14, [24, 24, 0, 0])
    ctx.fill()

    // Centered Logo
    if (logoImg.complete && logoImg.naturalWidth) {
      const logoW = 340
      const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW
      ctx.drawImage(logoImg, (W - logoW) / 2, 52, logoW, logoH)
    }

    let currentY = 175

    // Top Divider Line
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, currentY)
    ctx.lineTo(W - 50, currentY)
    ctx.stroke()
    currentY += 40

    // Main Title
    ctx.fillStyle = '#0F172A'
    ctx.font = '900 30px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Official Maintenance Resolution Receipt', W / 2, currentY)
    currentY += 32

    // Logged Date Subtitle
    ctx.fillStyle = '#64748B'
    ctx.font = '600 18px Segoe UI, sans-serif'
    ctx.fillText(`Logged on ${format(new Date(createdAt), 'dd MMM yyyy, HH:mm')}`, W / 2, currentY)
    currentY += 38

    // Ticket Reference Code Box
    const boxW = 700
    const boxH = 110
    const boxX = (W - boxW) / 2
    ctx.fillStyle = '#F0F7FF'
    ctx.beginPath()
    ctx.roundRect(boxX, currentY, boxW, boxH, 16)
    ctx.fill()
    ctx.strokeStyle = '#235EAA'
    ctx.lineWidth = 2.5
    ctx.setLineDash([8, 6])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#235EAA'
    ctx.font = '800 16px Segoe UI, sans-serif'
    ctx.fillText('REFERENCE TICKET CODE', W / 2, currentY + 34)

    ctx.fillStyle = '#163A6B'
    ctx.font = '900 40px monospace'
    ctx.fillText(ticketCode, W / 2, currentY + 80)
    currentY += boxH + 30

    // 2x2 Info Details Grid
    const itemW = 330
    const itemH = 85
    const col1X = boxX
    const col2X = boxX + itemW + 40

    const drawInfoBox = (x: number, y: number, label: string, val: string) => {
      ctx.fillStyle = '#F8FAFC'
      ctx.beginPath()
      ctx.roundRect(x, y, itemW, itemH, 12)
      ctx.fill()
      ctx.strokeStyle = '#E2E8F0'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748B'
      ctx.font = '800 15px Segoe UI, sans-serif'
      ctx.fillText(label.toUpperCase(), x + 16, y + 30)

      ctx.fillStyle = '#0F172A'
      ctx.font = '900 20px Segoe UI, sans-serif'
      ctx.fillText(val || '—', x + 16, y + 62)
    }

    drawInfoBox(col1X, currentY, 'Requester Name', requesterName)
    drawInfoBox(col2X, currentY, 'Mobile Number', mobile)
    currentY += itemH + 16

    drawInfoBox(col1X, currentY, 'Target Department', departmentName)
    drawInfoBox(col2X, currentY, 'Complaint Type', complaintType)
    currentY += itemH + 24

    // Verified Feedback Card on Receipt (Canvas)
    if (ticket?.feedback?.rating) {
      const fbH = 110
      ctx.fillStyle = '#FEFCE8' // gold light tint
      ctx.beginPath()
      ctx.roundRect(boxX, currentY, boxW, fbH, 14)
      ctx.fill()
      ctx.strokeStyle = '#FACC15'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#CA8A04'
      ctx.font = '900 17px Segoe UI, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`★ USER FEEDBACK: ${ticket.feedback.rating}/5 STARS VERIFIED`, boxX + 20, currentY + 36)

      ctx.fillStyle = '#1E293B'
      ctx.font = 'italic 600 18px Segoe UI, sans-serif'
      const fbComment = ticket.feedback.comment
        ? `"${ticket.feedback.comment.length > 65 ? ticket.feedback.comment.substring(0, 62) + '...' : ticket.feedback.comment}"`
        : 'User confirmed resolution satisfaction.'
      ctx.fillText(fbComment, boxX + 20, currentY + 76)

      currentY += fbH + 24
    }

    // Issue Description Box
    if (description) {
      const descH = 95
      ctx.fillStyle = '#F1F5F9'
      ctx.beginPath()
      ctx.roundRect(boxX, currentY, boxW, descH, 12)
      ctx.fill()

      ctx.fillStyle = '#235EAA'
      ctx.beginPath()
      ctx.roundRect(boxX, currentY, 8, descH, [12, 0, 0, 12])
      ctx.fill()

      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748B'
      ctx.font = '800 15px Segoe UI, sans-serif'
      ctx.fillText('ISSUE DESCRIPTION:', boxX + 24, currentY + 32)

      ctx.fillStyle = '#334155'
      ctx.font = 'italic 600 18px Segoe UI, sans-serif'
      ctx.fillText(
        `"${description.length > 55 ? description.substring(0, 52) + '...' : description}"`,
        boxX + 24,
        currentY + 68
      )
      currentY += descH + 20
    }

    // Official Stamp Footer
    ctx.fillStyle = '#64748B'
    ctx.font = '600 14px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Sri Eshwar College of Engineering • Campus Facility Support & Helpdesk', W / 2, H - 45)

    // Trigger instant PNG image download
    const link = document.createElement('a')
    link.download = `Ticket_Receipt_${ticketCode}.png`
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <TicketIcon size={18} className="text-[var(--primary-blue)]" />
            <h3 className="text-sm font-bold text-[var(--ink)]">Official Ticket Receipt</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Required Lock Alert */}
        {isDownloadLocked && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Feedback Required to Download</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Please submit your feedback rating on the ticket tracking page to unlock and download the official completion receipt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Printable / Viewable Receipt Container */}
        <div ref={printRef} className="receipt-card shadow-sm border-2 border-[#163a6b] rounded-2xl p-5 bg-white space-y-4">
          <div>
            {/* Centered Sri Eshwar Logo Header */}
            <div className="flex items-center justify-center border-b border-slate-200 pb-3 mb-3">
              <img src={sriEshwarLogo} alt="Sri Eshwar Logo" className="h-10 w-auto object-contain mx-auto" />
            </div>

            <div className="text-center my-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Maintenance Ticket Receipt
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Logged on {format(new Date(createdAt), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>

            {/* Ticket Reference Code Box */}
            <div className="code-box my-3 rounded-xl border-2 border-dashed border-[var(--primary-blue)] bg-blue-50/50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)]">
                Reference Ticket Code
              </p>
              <p className="code-text mt-0.5 font-mono text-2xl font-black text-[var(--primary-blue-deeper)] tracking-widest">
                {ticketCode}
              </p>
            </div>

            {/* Info Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="info-item rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="info-label text-[9px] font-bold text-slate-400 uppercase">Requester Name</span>
                <p className="info-val font-bold text-slate-900 mt-0.5 truncate">{requesterName}</p>
              </div>
              <div className="info-item rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="info-label text-[9px] font-bold text-slate-400 uppercase">Mobile Number</span>
                <p className="info-val font-bold text-slate-900 mt-0.5">{mobile || '—'}</p>
              </div>
              <div className="info-item rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="info-label text-[9px] font-bold text-slate-400 uppercase">Target Department</span>
                <p className="info-val font-bold text-slate-900 mt-0.5 truncate">{departmentName}</p>
              </div>
              <div className="info-item rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="info-label text-[9px] font-bold text-slate-400 uppercase">Complaint Type</span>
                <p className="info-val font-bold text-slate-900 mt-0.5 truncate">{complaintType}</p>
              </div>
            </div>

            {/* Feedback Badge if already submitted */}
            {hasFeedback && ticket?.feedback && (
              <div className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50/80 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="fill-[var(--gold)] text-[var(--gold)]" />
                    <span className="font-bold text-amber-950">
                      User Rating: {ticket.feedback.rating}/5 Stars
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                </div>
                {ticket.feedback.comment && (
                  <p className="mt-1 text-[11px] italic text-slate-700">
                    "{ticket.feedback.comment}"
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="desc-box mt-3 rounded-lg bg-slate-50 p-2.5 border-l-3 border-[var(--primary-blue)] text-xs text-slate-700">
                <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Issue Description:</span>
                <p className="italic font-medium line-clamp-2">"{description}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          {isDownloadLocked ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled
              className="flex-1 font-bold opacity-60 cursor-not-allowed"
            >
              <Lock size={15} /> Complete Feedback to Download
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleDownloadImage}
              className="flex-1 font-bold shadow-md cursor-pointer bg-emerald-600 hover:bg-emerald-700"
            >
              <Download size={16} /> Download Receipt Image
            </Button>
          )}
          <Button type="button" variant="outline" size="md" onClick={onClose} className="px-5 cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
