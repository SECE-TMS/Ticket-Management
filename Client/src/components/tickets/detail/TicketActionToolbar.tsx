import { CheckCircle2, Pencil, RotateCcw, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '../../common/Button';
import type { Ticket } from '../../../types';

interface TicketActionToolbarProps {
  ticket: Ticket;
  role?: string;
  isAdmin: boolean;
  actionLoading: boolean;
  canAssign: boolean;
  canReassign: boolean;
  canAccept: boolean;
  canStart: boolean;
  canResolve: boolean;
  canClose: boolean;
  canReopen: boolean;
  canEditResolutionProof: boolean;
  reviewRemarks: string;
  setReviewRemarks: (val: string) => void;
  onApproveClose: () => void;
  onRejectReopen: () => void;
  onAssignOpen: () => void;
  onResolveOpen: () => void;
  onEditResolutionOpen: () => void;
  onReopenOpen: () => void;
  onAccept: () => void;
  onStart: () => void;
  onCloseTicket: () => void;
  onDeleteModalOpen: () => void;
}

export function TicketActionToolbar({
  ticket,
  role,
  isAdmin,
  actionLoading,
  canAssign,
  canReassign,
  canAccept,
  canStart,
  canResolve,
  canClose,
  canReopen,
  canEditResolutionProof,
  reviewRemarks,
  setReviewRemarks,
  onApproveClose,
  onRejectReopen,
  onAssignOpen,
  onResolveOpen,
  onEditResolutionOpen,
  onReopenOpen,
  onAccept,
  onStart,
  onCloseTicket,
  onDeleteModalOpen,
}: TicketActionToolbarProps) {
  const hasActions =
    canAssign ||
    canReassign ||
    canClose ||
    canReopen ||
    canAccept ||
    canStart ||
    canResolve ||
    canEditResolutionProof ||
    ticket.status === 'pending_approval' ||
    isAdmin;

  if (!hasActions) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
        Actions
      </p>

      {/* Pending Approval Review & Decision Card for Admin / Manager */}
      {ticket.status === 'pending_approval' && (role === 'admin' || role === 'manager') && (
        <div className="w-full rounded-2xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⏳</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                Review Resolution &amp; Decision
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The assigned employee completed this ticket. Review their resolution notes and media proof below. You can approve to close, or reject with comments to automatically reopen for rework.
              </p>

              <div className="mt-3.5">
                <label
                  htmlFor="approval-remarks"
                  className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1"
                >
                  Reviewer Comments / Instructions
                </label>
                <textarea
                  id="approval-remarks"
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter comments for approval (optional) or explain why it is rejected and what needs to be fixed (required for reject)..."
                  className="w-full rounded-xl border border-amber-300 bg-[var(--white)] p-3 text-xs sm:text-sm text-[var(--ink)] placeholder:text-amber-800/40 outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 shadow-xs"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Button
                  id="action-approve-close"
                  type="button"
                  loading={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                  onClick={onApproveClose}
                >
                  ✓ Approve &amp; Close
                </Button>

                <Button
                  id="action-reject-reopen"
                  type="button"
                  variant="outline"
                  loading={actionLoading}
                  className="border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 font-bold shadow-xs cursor-pointer"
                  onClick={onRejectReopen}
                >
                  ✕ Reject &amp; Reopen for Rework
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approval Notice for Employee */}
      {ticket.status === 'pending_approval' && role === 'employee' && (
        <div className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-orange-800">⏳ Submitted for Approval</p>
            <p className="text-xs text-orange-600 mt-0.5">
              You have submitted your resolution work. The ticket is currently under review by your department manager.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEditResolutionProof && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onEditResolutionOpen}
                className="bg-white border-orange-300 text-orange-800 hover:bg-orange-100 font-bold shrink-0 gap-1.5"
              >
                <Pencil size={13} /> Update / Reupload Proof
              </Button>
            )}
            {canReopen && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onReopenOpen}
                className="bg-white border-red-300 text-red-800 hover:bg-red-50 font-bold shrink-0 gap-1.5"
              >
                <RotateCcw size={13} /> Reopen for Rework
              </Button>
            )}
          </div>
        </div>
      )}

      {ticket.status !== 'pending_approval' && canAssign && (
        <Button
          type="button"
          id="action-assign"
          onClick={onAssignOpen}
          className="bg-[var(--primary-blue)] hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <UserPlus size={14} />
          Assign Ticket
        </Button>
      )}

      {ticket.status !== 'pending_approval' && canReassign && (
        <Button
          type="button"
          id="action-reassign"
          variant="outline"
          onClick={onAssignOpen}
          className="border-indigo-300 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <UserCheck size={14} />
          Reassign Ticket
        </Button>
      )}

      {ticket.status !== 'pending_approval' && canAccept && (
        <Button
          id="action-accept"
          type="button"
          loading={actionLoading}
          onClick={onAccept}
        >
          Accept Ticket
        </Button>
      )}

      {ticket.status !== 'pending_approval' && canStart && (
        <Button
          id="action-start"
          type="button"
          loading={actionLoading}
          onClick={onStart}
        >
          Start Work
        </Button>
      )}

      {ticket.status !== 'pending_approval' && canResolve && (
        <Button
          id="action-resolve"
          type="button"
          variant="secondary"
          onClick={onResolveOpen}
        >
          {role === 'employee' ? 'Complete & Request Approval' : 'Mark Resolved'}
        </Button>
      )}

      {canEditResolutionProof && (
        <Button
          type="button"
          id="action-edit-proof"
          variant="outline"
          onClick={onEditResolutionOpen}
          className="border-blue-300 bg-blue-50/80 text-blue-700 hover:bg-blue-100 hover:border-blue-400 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Pencil size={14} />
          {ticket.resolution?.attachment?.url ? 'Change / Reupload Proof' : 'Upload Proof / Notes'}
        </Button>
      )}

      {ticket.status !== 'pending_approval' && canReopen && (
        <Button
          id="action-reopen"
          type="button"
          variant="outline"
          loading={actionLoading}
          onClick={onReopenOpen}
          className="border-red-300 bg-red-50/70 text-red-700 hover:bg-red-100 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RotateCcw size={14} />
          Reopen
        </Button>
      )}

      {canClose && (
        <Button
          id="action-close"
          type="button"
          variant="outline"
          loading={actionLoading}
          onClick={onCloseTicket}
          className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <CheckCircle2 size={14} />
          Close Ticket
        </Button>
      )}

      {isAdmin && (
        <Button
          id="action-delete-ticket"
          type="button"
          variant="outline"
          onClick={onDeleteModalOpen}
          className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
        >
          <Trash2 size={14} />
          Delete Permanently
        </Button>
      )}
    </div>
  );
}
