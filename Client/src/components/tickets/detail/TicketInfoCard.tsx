import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import { Button } from '../../common/Button';
import type { Ticket } from '../../../types';
import { getName } from '../../../types';

interface TicketInfoCardProps {
  ticket: Ticket;
  role?: string;
  isAdmin: boolean;
  onOpenEdit: () => void;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-sm text-[var(--ink)]">
        {value}
      </dd>
    </div>
  );
}

export function TicketInfoCard({
  ticket,
  role,
  isAdmin,
  onOpenEdit,
}: TicketInfoCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[var(--ink)]">Ticket Details</h2>
        {isAdmin && (
          <Button
            type="button"
            id="card-edit-ticket-btn"
            variant="outline"
            size="sm"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 text-xs font-bold border-blue-200 text-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)] cursor-pointer"
          >
            <Pencil size={12} />
            Edit Details
          </Button>
        )}
      </div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Info label="Requester" value={ticket.requester.name} />
        <Info label="Mobile" value={ticket.requester.mobile} />
        {ticket.requester.userType && (
          <Info
            label="Role & Roll No"
            value={`${ticket.requester.userType.toUpperCase()}${ticket.requester.rollNumber ? ` (${ticket.requester.rollNumber})` : ''}${ticket.requester.department ? ` • ${ticket.requester.department}` : ''}`}
          />
        )}
        {role !== 'employee' && (
          <Info label="Department" value={getName(ticket.department)} />
        )}
        {role !== 'employee' && (
          <Info label="Assignee" value={getName(ticket.assignedTo, 'Unassigned')} />
        )}
        {ticket.eventDate && (
          <Info
            label="Event Date"
            value={format(new Date(ticket.eventDate), 'dd MMM yyyy')}
          />
        )}
        {ticket.venue && <Info label="Venue" value={ticket.venue} />}
        {(ticket.block || ticket.floor) && (
          <Info
            label="Campus Location"
            value={`${ticket.block || '—'}${ticket.floor ? ` · ${ticket.floor}` : ''}`}
          />
        )}
        {ticket.eventTime && <Info label="Time" value={ticket.eventTime} />}
        <Info
          label="Created"
          value={format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm')}
        />
        <Info
          label="Expected by"
          value={
            ticket.expectedResolutionAt
              ? format(new Date(ticket.expectedResolutionAt), 'dd MMM yyyy, HH:mm')
              : '—'
          }
        />
      </dl>

      {ticket.description && (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--ink)]">
          {ticket.description}
        </div>
      )}
    </div>
  );
}
