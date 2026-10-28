import { Trash2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import type { Ticket } from '../../../types';

interface DeleteTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  loading: boolean;
  onConfirmDelete: () => void;
}

export function DeleteTicketModal({
  open,
  onClose,
  ticket,
  loading,
  onConfirmDelete,
}: DeleteTicketModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Ticket">
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 leading-relaxed">
          <p className="font-bold text-sm mb-1 text-red-950 flex items-center gap-1.5">
            <Trash2 size={16} className="text-red-600" />
            Soft Delete Ticket
          </p>
          Are you sure you want to delete ticket{' '}
          <strong className="font-mono text-red-950 bg-red-100 px-1.5 py-0.5 rounded">
            #{ticket.ticketCode}
          </strong>{' '}
          ({ticket.title || ticket.complaintType})?
          <br /><br />
          This ticket will be marked as deleted in the database and hidden from active views.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            id="confirm-delete-ticket-btn"
            type="button"
            loading={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md"
            onClick={onConfirmDelete}
          >
            Yes, Delete Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
}
