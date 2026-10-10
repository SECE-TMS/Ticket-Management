import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Download, ExternalLink, History, Volume2 } from 'lucide-react'
import { getAttachmentUrl } from '../../lib/utils'
import type { ResolutionHistoryItem } from '../../types'

interface ResolutionHistoryCardProps {
  history: ResolutionHistoryItem[]
  onViewImage: (url: string) => void
}

export function ResolutionHistoryCard({ history, onViewImage }: ResolutionHistoryCardProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (!history || history.length === 0) {
    return null
  }

  // Filter items that have at least an attachment or remarks
  const validHistory = history.filter(
    (item) => item.attachment?.url || (item.attachments && item.attachments.length > 0) || item.remarks
  )

  if (validHistory.length === 0) return null

  // Sort newest first
  const sorted = [...validHistory].reverse()

  const getActionBadge = (actionType?: string) => {
    switch (actionType) {
      case 'updated_proof':
        return { label: 'Proof Updated / Replaced', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'reopened':
      case 'approval_rejected':
      case 'requester_rejected':
        return { label: 'Past Revision (Reopened)', bg: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'pending_approval':
        return { label: 'Approval Submission', bg: 'bg-orange-50 text-orange-700 border-orange-200' }
      case 'resolved':
      default:
        return { label: 'Work Completed Proof', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    }
  }

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const resp = await fetch(getAttachmentUrl(url))
      const blob = await resp.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `past-work-proof-v${validHistory.length - index}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(getAttachmentUrl(url), '_blank')
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs overflow-hidden">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-slate-100/60 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              Past Uploaded Work Proofs &amp; Revisions
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                {validHistory.length} {validHistory.length === 1 ? 'version' : 'versions'}
              </span>
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              All previously submitted completion photos, audio notes, and rework iterations.
            </p>
          </div>
        </div>
        <div className="text-[var(--ink-muted)]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* History Items list */}
      {isOpen && (
        <div className="divide-y divide-[var(--border)] p-4 sm:p-5 space-y-4">
          {sorted.map((item, idx) => {
            const versionNum = sorted.length - idx
            const badge = getActionBadge(item.actionType)
            const resolvedByName =
              typeof item.resolvedBy === 'object' && item.resolvedBy
                ? (item.resolvedBy as { name?: string }).name
                : undefined
            const atts = item.attachments && item.attachments.length > 0
              ? item.attachments
              : item.attachment?.url
              ? [item.attachment]
              : []

            return (
              <div key={item._id || idx} className="pt-4 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700">
                      #{versionNum}
                    </span>
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {idx === 0 && (
                      <span className="rounded-md bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}
                  </div>
                </div>

                {resolvedByName && (
                  <p className="text-xs text-[var(--ink-muted)] mb-2">
                    Submitted by: <strong className="text-[var(--ink)]">{resolvedByName}</strong>
                  </p>
                )}

                {/* Remarks */}
                {item.remarks && (
                  <div className="mb-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 text-xs leading-relaxed text-[var(--ink)]">
                    <strong className="text-slate-700 font-semibold block mb-0.5">Notes:</strong>
                    {item.remarks}
                  </div>
                )}

                {/* Attachments for this iteration */}
                {atts.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 mt-2">
                    {atts.map((att, attIdx) => (
                      <div
                        key={attIdx}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
                      >
                        {att.type === 'image' && (
                          <div className="space-y-2">
                            <div
                              className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--border)] bg-black/5"
                              onClick={() => onViewImage(att.url)}
                            >
                              <img
                                src={getAttachmentUrl(att.url)}
                                alt={`Proof Revision #${versionNum}`}
                                className="h-36 w-full object-cover transition-all duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                                  <ExternalLink size={12} /> View Photo
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadImage(att.url, idx)}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--white)] hover:bg-[var(--surface-2)] py-1.5 px-2 text-[11px] font-semibold text-[var(--ink)] transition-colors cursor-pointer"
                            >
                              <Download size={12} /> Download Photo
                            </button>
                          </div>
                        )}
                        {att.type === 'audio' && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-[var(--ink)]">
                              <Volume2 size={14} className="text-[var(--primary-blue)]" />
                              Audio Voice Note
                            </div>
                            <audio controls src={getAttachmentUrl(att.url)} className="w-full h-9" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
