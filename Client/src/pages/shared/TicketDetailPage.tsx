import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { AssignModal } from '../../components/tickets/AssignModal';
import { ResolveModal } from '../../components/tickets/ResolveModal';
import { EditResolutionModal } from '../../components/tickets/EditResolutionModal';
import { ResolutionHistoryCard } from '../../components/tickets/ResolutionHistoryCard';
import { EditTicketModal } from '../../components/tickets/EditTicketModal';
import { ShareTicketModal } from '../../components/tickets/ShareTicketModal';
import { TicketDetailHeader } from '../../components/tickets/detail/TicketDetailHeader';
import { TicketActionToolbar } from '../../components/tickets/detail/TicketActionToolbar';
import { TicketInfoCard } from '../../components/tickets/detail/TicketInfoCard';
import { TicketMediaGallery } from '../../components/tickets/detail/TicketMediaGallery';
import { TicketFeedbackCard } from '../../components/tickets/detail/TicketFeedbackCard';
import { TicketCommentsThread } from '../../components/tickets/detail/TicketCommentsThread';
import { ReopenTicketModal } from '../../components/tickets/detail/ReopenTicketModal';
import { TicketImageLightbox } from '../../components/tickets/detail/TicketImageLightbox';
import { DeleteTicketModal } from '../../components/tickets/detail/DeleteTicketModal';
import { useToast } from '../../context/ToastContext';
import { useAppSelector } from '../../store/hooks';
import { getErrorMessage } from '../../lib/utils';
import type { Activity, Ticket, User } from '../../types';
import { getId, getName } from '../../types';

interface TicketDetailPageProps {
  backTo: string;
}

export function TicketDetailPage({ backTo }: TicketDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editResolutionOpen, setEditResolutionOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const navigate = useNavigate();

  // Staff Feedback state (Admin & Manager)
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackEditing, setFeedbackEditing] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await ticketService.getById(id);
      setTicket(data.ticket);
      setActivities(data.activities);

      if (role === 'admin' || role === 'manager') {
        const deptId = getId(data.ticket.department);
        if (deptId) {
          const emps = await userService.listByDepartment(deptId);
          setEmployees(emps.filter((e) => e.role === 'employee' && e.isActive));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load ticket'));
    } finally {
      setLoading(false);
    }
  }, [id, role, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (ticket?.feedback) {
      setFeedbackRating(ticket.feedback.rating || 0);
      setFeedbackComment(ticket.feedback.comment || '');
    } else {
      setFeedbackRating(0);
      setFeedbackComment('');
    }
  }, [ticket?.feedback]);

  if (loading) return <PageLoader />;
  if (!ticket) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-10 text-center shadow-xs">
        <p className="font-semibold text-[var(--ink)]">Ticket not found.</p>
        <Link
          to={backTo}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to tickets
        </Link>
      </div>
    );
  }

  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTicketAssigned = Boolean(ticket.assignedTo) || ticket.status === 'assigned';

  const currentUserId = getId(user);
  const assignedUserId = getId(ticket.assignedTo);
  const isAssignedToMe = Boolean(currentUserId && assignedUserId && currentUserId === assignedUserId);
  const isEmployeeAssigned = role === 'employee' ? isAssignedToMe : true;

  const canAssign =
    (role === 'admin' || role === 'manager') &&
    !isTicketAssigned &&
    ['new', 'reopened'].includes(ticket.status);

  const canReassign =
    (role === 'admin' || role === 'manager') &&
    isTicketAssigned &&
    ['assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status);
  const canClose =
    ['admin', 'manager', 'employee'].includes(role || '') &&
    ticket.status !== 'closed' &&
    isEmployeeAssigned;
  const canReopen =
    ['admin', 'manager', 'employee'].includes(role || '') &&
    ['resolved', 'closed', 'pending_approval'].includes(ticket.status) &&
    isEmployeeAssigned;
  const canAccept =
    role === 'employee' && (ticket.status === 'assigned' || ticket.status === 'reopened');
  const canStart = role === 'employee' && ticket.status === 'accepted';
  const canResolve =
    ['admin', 'manager', 'employee'].includes(role || '') &&
    ['new', 'assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status);
  const canManageFeedback = role === 'admin' || role === 'superadmin' || role === 'manager';

  const canEditResolutionProof =
    Boolean(
      role === 'admin' ||
        role === 'superadmin' ||
        role === 'manager' ||
        (role === 'employee' && isAssignedToMe)
    ) &&
    (Boolean(ticket.resolution?.attachment?.url || ticket.resolution?.remarks) ||
      ['pending_approval', 'resolved', 'closed', 'reopened'].includes(ticket.status));

  const handleSaveStaffFeedback = async () => {
    if (!ticket) return;
    if (feedbackRating < 1) {
      toast.error('Please select a rating from 1 to 5 stars.');
      return;
    }
    setFeedbackLoading(true);
    try {
      await ticketService.submitStaffFeedback(ticket._id, {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });
      toast.success('Feedback saved successfully!');
      setFeedbackEditing(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save feedback'));
    } finally {
      setFeedbackLoading(false);
    }
  };

  const run = async (fn: () => Promise<void>, success: string) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={15} />
        Back to tickets
      </Link>

      <TicketDetailHeader
        ticket={ticket}
        isAdmin={isAdmin}
        onOpenShare={() => setShareOpen(true)}
        onOpenEdit={() => setEditOpen(true)}
      />

      <TicketActionToolbar
        ticket={ticket}
        role={role}
        isAdmin={isAdmin}
        actionLoading={actionLoading}
        canAssign={canAssign}
        canReassign={canReassign}
        canAccept={canAccept}
        canStart={canStart}
        canResolve={canResolve}
        canClose={canClose}
        canReopen={canReopen}
        canEditResolutionProof={canEditResolutionProof}
        reviewRemarks={reviewRemarks}
        setReviewRemarks={setReviewRemarks}
        onApproveClose={() =>
          void run(async () => {
            await ticketService.approveClose(ticket._id, reviewRemarks.trim() || undefined);
            setReviewRemarks('');
          }, 'Ticket approved and closed!')
        }
        onRejectReopen={() => {
          if (!reviewRemarks.trim()) {
            toast.error('Please enter a rejection reason or rework instructions before rejecting.');
            return;
          }
          void run(async () => {
            await ticketService.reopen(ticket._id, reviewRemarks.trim());
            setReviewRemarks('');
          }, 'Ticket rejected — automatically reopened for employee rework.');
        }}
        onAssignOpen={() => setAssignOpen(true)}
        onResolveOpen={() => setResolveOpen(true)}
        onEditResolutionOpen={() => setEditResolutionOpen(true)}
        onReopenOpen={() => setReopenOpen(true)}
        onAccept={() =>
          void run(async () => {
            await ticketService.updateStatus(ticket._id, { status: 'accepted' });
          }, 'Ticket accepted')
        }
        onStart={() =>
          void run(async () => {
            await ticketService.updateStatus(ticket._id, { status: 'in_progress' });
          }, 'Marked in progress')
        }
        onCloseTicket={() =>
          void run(async () => {
            await ticketService.close(ticket._id);
          }, 'Ticket closed')
        }
        onDeleteModalOpen={() => setDeleteModalOpen(true)}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <TicketInfoCard
            ticket={ticket}
            role={role}
            isAdmin={isAdmin}
            onOpenEdit={() => setEditOpen(true)}
          />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
            <TicketMediaGallery
              ticket={ticket}
              canEditResolutionProof={canEditResolutionProof}
              onOpenEditResolution={() => setEditResolutionOpen(true)}
              onViewImage={(url) => setActiveImageModal(url)}
            />

            {ticket.resolution?.remarks && (
              <div className="mt-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success-light)] p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} className="text-[var(--success)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">
                    Employee Resolution Notes
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink)]">
                  {ticket.resolution.remarks}
                </p>
              </div>
            )}

            {ticket.resolutionHistory && ticket.resolutionHistory.length > 0 && (
              <div className="mt-4">
                <ResolutionHistoryCard
                  history={ticket.resolutionHistory}
                  onViewImage={(url) => setActiveImageModal(url)}
                />
              </div>
            )}
          </div>

          <TicketFeedbackCard
            ticket={ticket}
            canManageFeedback={canManageFeedback}
            feedbackRating={feedbackRating}
            setFeedbackRating={setFeedbackRating}
            feedbackHoverRating={feedbackHoverRating}
            setFeedbackHoverRating={setFeedbackHoverRating}
            feedbackComment={feedbackComment}
            setFeedbackComment={setFeedbackComment}
            feedbackEditing={feedbackEditing}
            setFeedbackEditing={setFeedbackEditing}
            feedbackLoading={feedbackLoading}
            onSaveStaffFeedback={handleSaveStaffFeedback}
          />

          <TicketCommentsThread
            ticket={ticket}
            comment={comment}
            setComment={setComment}
            actionLoading={actionLoading}
            onSubmitComment={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              void run(async () => {
                await ticketService.comment(ticket._id, comment.trim());
                setComment('');
              }, 'Comment added');
            }}
          />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-2">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">Activity Timeline</h2>
          <TicketTimeline activities={activities} />
        </div>
      </div>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        employees={employees}
        isReassign={isTicketAssigned}
        currentAssigneeName={getName(ticket.assignedTo)}
        expectedResolutionAt={ticket.expectedResolutionAt}
        initialPriority={ticket.priority}
        loading={actionLoading}
        onSubmit={async (payload) => {
          await run(async () => {
            if (isTicketAssigned) {
              await ticketService.reassign(ticket._id, {
                assignedTo: payload.assignedTo,
                message: payload.message,
              });
            } else {
              await ticketService.assign(ticket._id, {
                assignedTo: payload.assignedTo,
                priority: payload.priority,
              });
            }
            setAssignOpen(false);
          }, isTicketAssigned ? 'Ticket reassigned successfully' : 'Ticket assigned successfully');
        }}
      />

      <ResolveModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        loading={actionLoading}
        onSubmit={async ({ remarks, file }) => {
          await run(async () => {
            const fd = new FormData();
            fd.append('remarks', remarks);
            if (file) fd.append('attachment', file);
            await ticketService.resolve(ticket._id, fd);
            setResolveOpen(false);
          }, 'Ticket resolved');
        }}
      />

      <EditResolutionModal
        open={editResolutionOpen}
        onClose={() => setEditResolutionOpen(false)}
        loading={actionLoading}
        initialRemarks={ticket.resolution?.remarks || ''}
        currentAttachment={ticket.resolution?.attachment || null}
        onSubmit={async ({ remarks, file }) => {
          await run(async () => {
            const fd = new FormData();
            if (remarks) fd.append('remarks', remarks);
            if (file) fd.append('attachment', file);
            await ticketService.updateResolution(ticket._id, fd);
            setEditResolutionOpen(false);
          }, 'Work completion proof updated successfully');
        }}
      />

      <ReopenTicketModal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        reason={reopenReason}
        setReason={setReopenReason}
        loading={actionLoading}
        onConfirmReopen={() => {
          void run(async () => {
            await ticketService.reopen(
              ticket._id,
              reopenReason.trim() ||
                (role === 'employee' ? 'Reopened by employee' : 'Reopened by manager')
            );
            setReopenOpen(false);
            setReopenReason('');
          }, 'Ticket reopened');
        }}
      />

      <TicketImageLightbox
        imageUrl={activeImageModal}
        onClose={() => setActiveImageModal(null)}
      />

      {isAdmin && (
        <EditTicketModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          ticket={ticket}
          onSuccess={load}
        />
      )}

      {ticket && (
        <ShareTicketModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          ticketCode={ticket.ticketCode}
          mobile={ticket.requester?.mobile}
          requesterName={ticket.requester?.name}
          departmentName={getName(ticket.department)}
          title={ticket.title}
          complaintType={ticket.complaintType}
          status={ticket.status}
          eventDate={ticket.eventDate}
          venue={ticket.venue}
          eventTime={ticket.eventTime}
          priority={ticket.priority}
          block={ticket.block}
          floor={ticket.floor}
        />
      )}

      {isAdmin && ticket && (
        <DeleteTicketModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          ticket={ticket}
          loading={actionLoading}
          onConfirmDelete={() =>
            void run(async () => {
              await ticketService.delete(ticket._id);
              setDeleteModalOpen(false);
              navigate(backTo);
            }, 'Ticket deleted permanently')
          }
        />
      )}
    </div>
  );
}
