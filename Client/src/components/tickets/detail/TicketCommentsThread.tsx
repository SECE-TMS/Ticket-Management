import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { Button } from '../../common/Button';
import type { Ticket } from '../../../types';
import { getName } from '../../../types';

interface TicketCommentsThreadProps {
  ticket: Ticket;
  comment: string;
  setComment: (c: string) => void;
  actionLoading: boolean;
  onSubmitComment: (e: React.FormEvent) => void;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function TicketCommentsThread({
  ticket,
  comment,
  setComment,
  actionLoading,
  onSubmitComment,
}: TicketCommentsThreadProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
      <h2 className="text-base font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-[var(--primary-blue)]" />
        Comments
      </h2>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSubmitComment}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add an internal note…"
          className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          id="ticket-comment-input"
        />
        <Button type="submit" loading={actionLoading} size="md">
          Post
        </Button>
      </form>

      {!!ticket.comments?.length && (
        <ul className="mt-4 space-y-3">
          {ticket.comments.map((c, idx) => {
            const isReq = c.isRequester || !c.author;
            const authorName = isReq
              ? c.authorName || ticket.requester.name
              : getName(c.author, 'Staff');
            return (
              <li
                key={c._id || idx}
                className={`rounded-xl p-3.5 text-sm border ${
                  isReq
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-[var(--surface)] border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase ${
                        isReq
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]'
                      }`}
                    >
                      {getInitials(authorName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-[var(--ink)]">
                          {authorName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            isReq
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-[var(--primary-blue)] border border-blue-200'
                          }`}
                        >
                          {isReq ? 'Requester' : 'Staff'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {format(new Date(c.createdAt), 'dd MMM, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[var(--ink)] pl-9">{c.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
