import { Camera, Clock, ExternalLink, Pencil, Volume2 } from 'lucide-react';
import { getAttachmentUrl } from '../../../lib/utils';
import type { Ticket } from '../../../types';

interface TicketMediaGalleryProps {
  ticket: Ticket;
  canEditResolutionProof: boolean;
  onOpenEditResolution: () => void;
  onViewImage: (url: string) => void;
}

export function TicketMediaGallery({
  ticket,
  canEditResolutionProof,
  onOpenEditResolution,
  onViewImage,
}: TicketMediaGalleryProps) {
  const allAtts = ticket.userAttachments?.length
    ? ticket.userAttachments
    : ticket.userAttachment?.url
    ? [ticket.userAttachment]
    : [];

  const isCompleted =
    ticket.status === 'resolved' ||
    ticket.status === 'closed' ||
    Boolean(ticket.resolution?.attachment?.url);

  return (
    <div className="mt-6 border-t border-[var(--border)] pt-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-3 flex items-center gap-2">
        <Camera size={15} className="text-[var(--primary-blue)]" />
        Media Proof &amp; Attachments
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card 1: Initial Reported Issue Attachment (Before) */}
        <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)]">
                📸 Initial Reported Issue
              </span>
              <span className="rounded-full bg-[var(--primary-blue-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-blue)]">
                Before
              </span>
            </div>

            {!allAtts.length ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--white)] p-3 text-center">
                <Camera size={22} className="mb-1 text-[var(--ink-muted)] opacity-50" />
                <p className="text-xs font-semibold text-[var(--ink-muted)]">
                  No media attached during submission
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAtts.map((att, idx) => (
                  <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--white)] p-2">
                    {att.type === 'image' && (
                      <div
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--border)] bg-black/5"
                        onClick={() => onViewImage(att.url)}
                      >
                        <img
                          src={getAttachmentUrl(att.url)}
                          alt={`Attachment ${idx + 1}`}
                          className="h-44 w-full object-cover transition-all duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                            <ExternalLink size={13} /> View Photo
                          </span>
                        </div>
                      </div>
                    )}
                    {att.type === 'video' && (
                      <div className="overflow-hidden rounded-lg bg-black">
                        <video controls src={getAttachmentUrl(att.url)} className="w-full max-h-52 rounded-lg object-contain" />
                      </div>
                    )}
                    {att.type === 'audio' && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[var(--ink)]">
                          <Volume2 size={15} className="text-[var(--primary-blue)]" />
                          Voice Note Attachment {allAtts.length > 1 ? `#${idx + 1}` : ''}
                        </div>
                        <audio controls src={getAttachmentUrl(att.url)} className="w-full h-10" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Employee Resolution Proof Attachment (After) */}
        <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isCompleted ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'
                }`}
              >
                {isCompleted ? '✅ Completion Proof' : '⏳ Completion Proof'}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isCompleted
                    ? 'bg-[var(--success-light)] text-[var(--success)]'
                    : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                }`}
              >
                {isCompleted ? 'After' : 'Pending'}
              </span>
            </div>

            {ticket.resolution?.attachment?.url ? (
              ticket.resolution.attachment.type === 'image' ? (
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-green-200 bg-black/5"
                  onClick={() => onViewImage(ticket.resolution!.attachment!.url!)}
                >
                  <img
                    src={getAttachmentUrl(ticket.resolution.attachment.url)}
                    alt="Completion Resolution Proof"
                    className="h-44 w-full object-cover transition-all duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                      <ExternalLink size={13} /> View Resolution Photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-[var(--white)] p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--success)]">
                    <Volume2 size={15} /> Employee Audio Proof
                  </div>
                  <audio controls src={getAttachmentUrl(ticket.resolution.attachment.url)} className="w-full h-10" />
                </div>
              )
            ) : (
              <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--white)] p-3 text-center">
                <Clock size={22} className="mb-1 text-[var(--ink-muted)] opacity-50" />
                <p className="text-xs font-semibold text-[var(--ink-muted)]">
                  {ticket.status === 'resolved' || ticket.status === 'closed'
                    ? 'Resolved without attachment'
                    : 'Pending employee completion proof'}
                </p>
              </div>
            )}

            {canEditResolutionProof && (
              <button
                type="button"
                onClick={onOpenEditResolution}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 py-1.5 px-3 text-xs font-bold text-[var(--primary-blue)] transition-colors cursor-pointer"
              >
                <Pencil size={12} /> Change / Fix Proof &amp; Notes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
