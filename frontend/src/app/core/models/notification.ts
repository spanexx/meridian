/**
 * Notification models — canonical API shapes for the notifications system.
 *
 * Source: docs/features/frontend-data-layer/api-models-reference.md (Notification section).
 * No endpoints are documented yet (gap §4.3); only the type list and payload shape are
 * specified. The backend pack must write docs/apis/07-notifications-api.md. The
 * NotificationItem extension below is a mock/UI addition for the wireframe alerts page
 * until that doc exists.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Notification event types — from journey tables only. */
export type NotificationType =
  | 'EXECUTION_STARTED'
  | 'EXECUTION_ACQUIRED'
  | 'EXECUTION_FIRST_SALE'
  | 'EXECUTION_COMPLETED'
  | 'PAYOUT_READY'
  | 'PAYOUT_PENDING'
  | 'PAYOUT_COMPLETED'
  | 'EXECUTION_LOSS';

/** Notification payload — no id/read/created_at/route documented (gap §4.3). */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    payout_id: string;
    amount: number;
    type: string;
  };
}

// Re-export NotificationPrefs from member.ts (already defined there per member settings).
export type { NotificationPrefs } from './member';

/**
 * Mock/UI extension for the wireframe alerts page.
 *
 * DISCOVERY 2026-08-18: The API does not yet document id, read, created_at, or route
 * fields — they are added here solely for the frontend mock and wireframe display.
 * Remove or align once docs/apis/07-notifications-api.md is published.
 * See docs/features/frontend-data-layer/api-models-reference.md:243.
 */
export interface NotificationItem extends NotificationPayload {
  id: string;
  read: boolean;
  created_at: string;
  route: string | null;
}