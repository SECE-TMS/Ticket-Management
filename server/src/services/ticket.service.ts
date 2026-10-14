/**
 * Ticket Service Facade
 *
 * Refactored from monolithic 2,396-line file into modular single-responsibility sub-services:
 * - ticketCommon.ts: Query & filter helpers, access guards, durations
 * - ticketNotification.service.ts: HTML email template builders & notifications
 * - ticketPublic.service.ts: Public creation, tracking, requester approvals/comments
 * - ticketAssignment.service.ts: Assign, reassign, update ticket details
 * - ticketLifecycle.service.ts: Status transitions, resolutions, proofs, approvals, reopen
 * - ticketQuery.service.ts: List tickets, get by ID, delete ticket
 * - ticketExport.service.ts: CSV and styled Excel spreadsheet generation
 * - ticketFeedback.service.ts: Feedback submissions & admin analytical aggregations
 */

export * from './ticket/ticketCommon';
export * from './ticket/ticketNotification.service';
export * from './ticket/ticketPublic.service';
export * from './ticket/ticketAssignment.service';
export * from './ticket/ticketLifecycle.service';
export * from './ticket/ticketComment.service';
export * from './ticket/ticketQuery.service';
export * from './ticket/ticketExport.service';
export * from './ticket/ticketFeedback.service';
