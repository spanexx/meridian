# Notifications API

## Overview

Notification and notification-preference endpoints for the signed-in member:
list notifications, mark them read, and read/update notification settings.

Canonical models: `NotificationItem extends NotificationPayload` from
`frontend/src/app/core/models/notification.ts`; `NotificationPrefs` from
`frontend/src/app/core/models/member.ts`.

> **Status note:** `ApiClient` + `MockGateway` already serve `GET /notifications`,
> `GET /members/me/settings`, and `POST /notifications/read-all` (reference gap
> §4.3 in `docs/features/frontend-data-layer/api-models-reference.md`); `POST
> /notifications/{id}/read` is specified here as the symmetric counterpart.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List signed-in member's notifications |
| POST | `/notifications/{id}/read` | Mark a single notification read |
| POST | `/notifications/read-all` | Mark all notifications read |
| GET | `/members/me/settings` | Get notification preferences |
| PATCH | `/members/me/settings` | Update notification preferences |

---

## GET /notifications

List the signed-in member's notifications, newest first. `Authorization: Bearer <access_token>`.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "n1",
        "type": "EXECUTION_FIRST_SALE",
        "title": "E-1042 · Size 10.5 sold on GOAT",
        "body": "$2,880 recovered — 3 of 8 items sold, ROI tracking at +12.4%.",
        "data": { "payout_id": "", "amount": 2880, "type": "EXECUTION" },
        "read": false,
        "created_at": "2026-08-19T09:15:00Z",
        "route": "/executions/E-1042"
      }
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique notification id |
| `type` | NotificationType | Event kind (see below) |
| `title` | string | Short headline |
| `body` | string | Longer description |
| `data` | object? | Optional `{ payout_id: string, amount: number, type: string }` |
| `read` | boolean | Whether the notification has been read |
| `created_at` | string (ISO 8601) | When the notification was created |
| `route` | string/null | Frontend route to deep-link the notification |

### NotificationType

| Value | Trigger |
|-------|---------|
| `EXECUTION_STARTED` | Execution funded and started (journey 05) |
| `EXECUTION_ACQUIRED` | Acquisition complete (journey 05) |
| `EXECUTION_FIRST_SALE` | First sale recorded (journey 05) |
| `EXECUTION_COMPLETED` | Execution completed (journey 05) |
| `PAYOUT_READY` | Payout ready to withdraw (journey 05) |
| `PAYOUT_PENDING` | Payout calculated, pending distribution (journey 06) |
| `PAYOUT_COMPLETED` | Payout distributed (journey 06) |
| `EXECUTION_LOSS` | Loss incurred (journey 06) |

**Errors:** `AUTH_TOKEN_EXPIRED` (401) — session expired.

---

## POST /notifications/{id}/read

Mark a single notification as read. No request body.

### Response (200 OK)

```json
{
  "success": true,
  "data": { "read": true }
}
```

**Errors:** `NOTIFICATION_NOT_FOUND` (404) — notification id does not exist for this member.

---

## POST /notifications/read-all

Mark all of the signed-in member's notifications as read. `updated` reports how many transitioned from unread to read. No request body.

### Response (200 OK)

```json
{
  "success": true,
  "data": { "updated": 7 }
}
```

**Errors:** `AUTH_TOKEN_EXPIRED` (401) — session expired.

---

## GET /members/me/settings

Get the signed-in member's notification preferences. Mirrors `members.md`
§GET /members/me/settings. `Authorization: Bearer <access_token>`.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "settings": {
      "email_notifications": true,
      "push_notifications": true,
      "newsletter": false
    }
  }
}
```

---

## PATCH /members/me/settings

Partially update notification preferences. Any subset of `email_notifications`,
`push_notifications`, `newsletter` (all optional booleans) may be provided;
omitted fields are left unchanged. `Authorization: Bearer <access_token>`.

### Request

```json
{
  "email_notifications": false
}
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "settings": {
      "email_notifications": false,
      "push_notifications": true,
      "newsletter": false
    }
  }
}
```

### Side Effects

- Updates `settings.updated_at`; emits audit event (recommended) `member.settings_updated`

---

## Canonical Models

Source contracts: `NotificationPayload`/`NotificationItem`/`NotificationType`
in `frontend/src/app/core/models/notification.ts`; `NotificationPrefs` in
`frontend/src/app/core/models/member.ts`.

```ts
// notification.ts
export type NotificationType =
  | 'EXECUTION_STARTED' | 'EXECUTION_ACQUIRED' | 'EXECUTION_FIRST_SALE'
  | 'EXECUTION_COMPLETED' | 'PAYOUT_READY' | 'PAYOUT_PENDING'
  | 'PAYOUT_COMPLETED' | 'EXECUTION_LOSS';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: { payout_id: string; amount: number; type: string };
}

export interface NotificationItem extends NotificationPayload {
  id: string;
  read: boolean;
  created_at: string;
  route: string | null;
}

// member.ts
export interface NotificationPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter: boolean;
}
```

> **Frontend/UI extensions — OPEN QUESTION:** `id`, `read`, `created_at`, and
> `route` are **mock/UI-added** fields, documented here for transport shape but
> **NOT canonical server fields** (added only to drive the wireframe alerts
> page). Should they be promoted to canonical API fields (server-generated) or
> kept client/UI-only? Resolve before the backend implements this contract.

---

## CONFLICTS / Gaps

**(a) NotificationType union is execution/payout-centric.** The canonical enum
covers only the execution/payout lifecycle. The wireframe alerts page also
renders vote-reminder, proposal, reserve/liquidity, reputation-milestone, and
pool-snapshot notifications — the mock maps those onto the closest
execution/payout values (e.g. "New proposal" → `EXECUTION_STARTED`, "Pool
snapshot" → `EXECUTION_COMPLETED`). The canonical `NotificationType` will
likely need to **grow** to represent these event kinds explicitly.

**(b) Real-time delivery unspecified.** No WebSocket/SSE push channel is
defined. `docs/apis/00-api-conventions.md` defines a `member:{id}` WS channel
for member notifications, but the wire is not specified. Decide: push vs.
poll-only for now, and if pushing, which channel/message shape.

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /notifications | 60 | 1 min |
| POST /notifications/read-all | 30 | 1 min |
| GET & PATCH /members/me/settings | 30 | 1 min |

---

## Reputation Impact

None — reading notifications and updating settings have no reputation effect.
