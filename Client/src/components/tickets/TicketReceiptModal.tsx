import { useRef } from 'react'
import { Printer, X } from 'lucide-react'
import { Button } from '../common/Button'
import sriEshwarLogo from '../../assets/sri_eshwar_clean.png'
import isaiiLogo from '../../assets/isaii_clean.png'
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
}

export function TicketReceiptModal({
  isOpen,
  onClose,
  ticket,
  ticketCode = ticket?.ticketCode || 'TMS-2026',
  mobile = ticket?.requester?.mobile || '',
  requesterName = ticket?.requester?.name || 'Valued User',
  departmentName = typeof ticket?.department === 'object' ? ticket.department.name : 'Department',
  complaintType = ticket?.complaintType || 'Service Request',
  description = ticket?.description || '',
  createdAt = ticket?.createdAt || new Date().toISOString(),
}: TicketReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Receipt - ${ticketCode}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            .receipt-card { max-width: 650px; margin: 0 auto; border: 2px solid #1e3a8a; border-radius: 16px; padding: 28px; }
            .header-flex { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .brand-badge { background: #1e3a8a; color: white; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 13px; }
            .code-box { background: #f8fafc; border: 1px dashed #2563eb; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
            .code-text { font-family: monospace; font-size: 26px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; font-size: 13px; }
            .info-item { background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .info-val { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            .desc-box { background: #f1f5f9; padding: 14px; border-radius: 10px; border-left: 4px solid #2563eb; font-size: 13px; margin-top: 14px; }
            .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; border-top: 1px border #e2e8f0; pt: 12px; }
            @media print {
              body { padding: 0; }
              .receipt-card { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Printer size={20} className="text-[var(--primary-blue)]" />
            <h3 className="text-base font-bold text-[var(--ink)]">Official Ticket Receipt</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Area Container */}
        <div ref={printRef} className="receipt-card">
          <div className="header-flex flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img src={sriEshwarLogo} alt="Sri Eshwar Logo" className="h-9 w-auto object-contain" />
              <div className="h-6 w-px bg-slate-300" />
              <img src={isaiiLogo} alt="ISAII Logo" className="h-8 w-auto object-contain scale-110" />
            </div>
            <span className="brand-badge">TMS Acknowledgment</span>
          </div>

          <div className="text-center my-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Maintenance Ticket Receipt
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged on {format(new Date(createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>

          {/* Ticket Code Box */}
          <div className="code-box my-4 rounded-2xl border-2 border-dashed border-[var(--primary-blue)] bg-blue-50/50 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-blue)]">
              Reference Ticket Code
            </p>
            <p className="code-text mt-1 font-mono text-2xl sm:text-3xl font-black text-[var(--primary-blue-deeper)] tracking-widest">
              {ticketCode}
            </p>
          </div>

          {/* Info Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="info-item rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="info-label text-[10px] font-bold text-slate-400 uppercase">Requester Name</span>
              <p className="info-val font-bold text-slate-900 mt-0.5">{requesterName}</p>
            </div>
            <div className="info-item rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="info-label text-[10px] font-bold text-slate-400 uppercase">Mobile Number</span>
              <p className="info-val font-bold text-slate-900 mt-0.5">{mobile || '—'}</p>
            </div>
            <div className="info-item rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="info-label text-[10px] font-bold text-slate-400 uppercase">Target Department</span>
              <p className="info-val font-bold text-slate-900 mt-0.5">{departmentName}</p>
            </div>
            <div className="info-item rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="info-label text-[10px] font-bold text-slate-400 uppercase">Complaint Type</span>
              <p className="info-val font-bold text-slate-900 mt-0.5">{complaintType}</p>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="desc-box mt-4 rounded-xl bg-slate-50 p-3.5 border-l-4 border-[var(--primary-blue)] text-xs text-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Issue Description:</span>
              <p className="italic font-medium">"{description}"</p>
            </div>
          )}

          {/* Footer Note */}
          <div className="footer text-center mt-6 pt-3 border-t border-slate-200 text-[11px] text-slate-400">
            Keep this receipt for reference. Track progress at http://localhost:5173/track-ticket
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrint}
            className="flex-1 font-bold shadow-md"
          >
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <Button type="button" variant="outline" size="md" onClick={onClose} className="px-5">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
