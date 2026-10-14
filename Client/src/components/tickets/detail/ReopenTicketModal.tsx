import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';

interface ReopenTicketModalProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (val: string) => void;
  loading: boolean;
  onConfirmReopen: () => void;
}

export function ReopenTicketModal({
  open,
  onClose,
  reason,
  setReason,
  loading,
  onConfirmReopen,
}: ReopenTicketModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Reopen Ticket">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirmReopen();
        }}
        className="space-y-4"
      >
        <p className="text-xs text-[var(--ink-muted)]">
          Explain why this ticket is being reopened. The employee, manager, and requester will be notified.
        </p>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-1">
            Reopen Reason / Instructions
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for reopening..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Confirm Reopen
          </Button>
        </div>
      </form>
    </Modal>
  );
}
