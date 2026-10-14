import { Pencil, Share2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { PriorityBadge, StatusBadge } from '../../common/Badge';
import type { Ticket } from '../../../types';

interface TicketDetailHeaderProps {
  ticket: Ticket;
  isAdmin: boolean;
  onOpenShare: () => void;
  onOpenEdit: () => void;
}

export function TicketDetailHeader({
  ticket,
  isAdmin,
  onOpenShare,
  onOpenEdit,
}: TicketDetailHeaderProps) {
  return (
    <div className="mb-5 rounded-xl bg-[var(--primary-blue)] p-5 text-[var(--white)] shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
            Ticket
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            {ticket.title || ticket.ticketCode}
          </h1>
          <p className="mt-1 text-sm text-white/75">
            {ticket.title ? `${ticket.ticketCode} • ${ticket.complaintType}` : ticket.complaintType}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <Button
            type="button"
            id="header-share-ticket-btn"
            variant="outline"
            size="sm"
            onClick={onOpenShare}
            className="bg-white/15 hover:bg-white/25 border-white/30 text-white font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer backdrop-blur-xs"
          >
            <Share2 size={13} />
            Share
          </Button>
          {isAdmin && (
            <Button
              type="button"
              id="header-edit-ticket-btn"
              variant="outline"
              size="sm"
              onClick={onOpenEdit}
              className="bg-white/15 hover:bg-white/25 border-white/30 text-white font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer backdrop-blur-xs"
            >
              <Pencil size={13} />
              Edit Ticket
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
