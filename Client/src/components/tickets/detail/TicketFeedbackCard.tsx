import { format } from 'date-fns';
import { Pencil, Star, ThumbsUp } from 'lucide-react';
import { Button } from '../../common/Button';
import type { Ticket } from '../../../types';

interface TicketFeedbackCardProps {
  ticket: Ticket;
  canManageFeedback: boolean;
  feedbackRating: number;
  setFeedbackRating: (r: number) => void;
  feedbackHoverRating: number;
  setFeedbackHoverRating: (r: number) => void;
  feedbackComment: string;
  setFeedbackComment: (c: string) => void;
  feedbackEditing: boolean;
  setFeedbackEditing: (e: boolean) => void;
  feedbackLoading: boolean;
  onSaveStaffFeedback: () => void;
}

export function TicketFeedbackCard({
  ticket,
  canManageFeedback,
  feedbackRating,
  setFeedbackRating,
  feedbackHoverRating,
  setFeedbackHoverRating,
  feedbackComment,
  setFeedbackComment,
  feedbackEditing,
  setFeedbackEditing,
  feedbackLoading,
  onSaveStaffFeedback,
}: TicketFeedbackCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            Work Done Feedback &amp; Rating
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Quality assessment and satisfaction rating for the executed work.
          </p>
        </div>

        {ticket.feedback?.rating && !feedbackEditing && canManageFeedback && (
          <button
            type="button"
            onClick={() => {
              setFeedbackRating(ticket.feedback?.rating || 5);
              setFeedbackComment(ticket.feedback?.comment || '');
              setFeedbackEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors cursor-pointer"
          >
            <Pencil size={13} /> Edit Feedback
          </button>
        )}
      </div>

      {ticket.feedback?.rating && !feedbackEditing ? (
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={
                      star <= (ticket.feedback?.rating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }
                  />
                ))}
              </div>
              <span className="text-lg font-black text-amber-950">
                {ticket.feedback.rating} / 5
              </span>
              <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                {ticket.feedback.rating === 5
                  ? '★ Excellent'
                  : ticket.feedback.rating === 4
                  ? '★ Good'
                  : ticket.feedback.rating === 3
                  ? '★ Average'
                  : ticket.feedback.rating === 2
                  ? '★ Poor'
                  : '★ Very Poor'}
              </span>
            </div>

            {ticket.feedback.submittedAt && (
              <span className="text-xs text-amber-800/80 font-medium">
                Submitted on {format(new Date(ticket.feedback.submittedAt), 'dd MMM yyyy, HH:mm')}
              </span>
            )}
          </div>

          {ticket.feedback.comment ? (
            <div className="mt-3.5 rounded-lg bg-white/90 border border-amber-200/60 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-1">
                Feedback Remarks
              </p>
              <p className="text-sm text-[var(--ink)] italic leading-relaxed">
                "{ticket.feedback.comment}"
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-amber-800/70 italic">
              No additional written remarks provided.
            </p>
          )}
        </div>
      ) : canManageFeedback ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2">
              Select Satisfaction Rating (1 - 5 Stars) *
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeVal = feedbackHoverRating || feedbackRating;
                  const isFilled = star <= activeVal;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setFeedbackHoverRating(star)}
                      onMouseLeave={() => setFeedbackHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={28}
                        className={
                          isFilled
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        }
                      />
                    </button>
                  );
                })}
              </div>
              {feedbackRating > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">
                  {feedbackRating === 5
                    ? '5 Stars - Excellent'
                    : feedbackRating === 4
                    ? '4 Stars - Good'
                    : feedbackRating === 3
                    ? '3 Stars - Average'
                    : feedbackRating === 2
                    ? '2 Stars - Poor'
                    : '1 Star - Very Poor'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="staff-feedback-comment"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5"
            >
              Feedback Comments &amp; Review Remarks
            </label>
            <textarea
              id="staff-feedback-comment"
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Enter review comments regarding the work completed, timeliness, or resolution quality..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onSaveStaffFeedback}
              loading={feedbackLoading}
              size="md"
              className="gap-1.5"
            >
              <ThumbsUp size={14} />
              {ticket.feedback?.rating ? 'Update Feedback' : 'Submit Feedback'}
            </Button>

            {feedbackEditing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFeedbackRating(ticket.feedback?.rating || 0);
                  setFeedbackComment(ticket.feedback?.comment || '');
                  setFeedbackEditing(false);
                }}
                size="md"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <Star size={24} className="mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
          <p className="text-xs font-semibold text-[var(--ink-muted)]">
            No feedback has been recorded for this ticket yet.
          </p>
        </div>
      )}
    </div>
  );
}
