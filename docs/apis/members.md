# Member API

## Overview

Member endpoints for retrieving and updating the authenticated member’s profile and preferences.

This API represents the **core participant identity** in MERIDIAN:
- A **Member** can contribute **capital**, **signals**, and/or **access**.
- Member state gates access to features (e.g., `status`, `kyc_status`, roles).
- Member data is stored in MongoDB `members` and referenced by other domains (capital, opportunities, executions, payouts).

---

## Member Resource Model

### Member

Represents a single platform participant.

Key properties (as currently modeled in `pkg/models/member.go`):
- `id`
- `full_name`
- `username`
- `email`
- `status`
- `profile` (first/last/display name, phone, locale)
- `roles`
- `kyc_status`
- `settings`
- `email_verified`
- `two_factor_enabled`
- `created_at`, `updated_at`

Sensitive fields are never returned:
- `password_hash`
- `two_factor_secret`

### Enums

#### Member Status

Current implementation uses lowercase string statuses:
- `pending`
- `active`
- `inactive`
- `suspended`

#### Member Roles

- `MEMBER`
- `VETTER`
- `OPERATOR`
- `ADMIN`

#### KYC Status

- `NOT_STARTED`
- `PENDING`
- `VERIFIED`
- `REJECTED`

---

## Authentication & Authorization

All endpoints in this document require authentication.

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Authorization Rules

- A standard member can read/update **their own** profile and settings.
- Elevated roles (e.g. `ADMIN`) may later gain access to manage other members, but that is **out of scope** for the initial Member API surface.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/members/me` | Get the current authenticated member |
| PUT | `/members/me` | Update the current member’s profile fields |
| GET | `/members/me/settings` | Get the current member’s settings/preferences |
| PUT | `/members/me/settings` | Update the current member’s settings/preferences |

---

## GET /members/me

Get the authenticated member.

### Story

> As a member, I want to view my account details so I can confirm my profile and eligibility.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "member": {
      "id": "507f1f77bcf86cd799439011",
      "full_name": "Jane Doe",
      "username": "janedoe",
      "email": "jane@example.com",
      "status": "active",
      "email_verified": true,
      "two_factor_enabled": false,
      "roles": ["MEMBER"],
      "kyc_status": "NOT_STARTED",
      "profile": {
        "first_name": "Jane",
        "last_name": "Doe",
        "display_name": "janedoe",
        "phone": "+1234567890",
        "country": "US",
        "timezone": "America/New_York",
        "avatar_url": "https://..."
      },
      "settings": {
        "email_notifications": true,
        "push_notifications": true,
        "newsletter": false
      },
      "created_at": "2026-03-13T10:00:00Z",
      "updated_at": "2026-03-13T10:10:00Z"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:10:00Z"
  }
}
```

### Errors

| Code | Condition |
|------|-----------|
| `AUTH_TOKEN_MISSING` | No bearer token provided |
| `AUTH_TOKEN_INVALID` | Token malformed/invalid |
| `AUTH_TOKEN_EXPIRED` | Token expired |

---

## PUT /members/me

Update the authenticated member’s profile fields.

### Story

> As a member, I want to update my profile so my contributions and payouts reflect accurate identity details.

### Request

```json
{
  "full_name": "Jane Doe",
  "username": "janedoe",
  "profile": {
    "first_name": "Jane",
    "last_name": "Doe",
    "display_name": "janedoe",
    "phone": "+1234567890",
    "country": "US",
    "timezone": "America/New_York",
    "avatar_url": "https://..."
  }
}
```

### Validation

| Field | Rules |
|-------|-------|
| full_name | Optional, 1-120 chars |
| username | Optional, 3-30 chars, unique |
| profile.first_name | Optional, 1-50 chars |
| profile.last_name | Optional, 1-50 chars |
| profile.display_name | Optional, 3-30 chars |
| profile.phone | Optional, phone format |
| profile.country | Optional, ISO country code |
| profile.timezone | Optional, IANA timezone |
| profile.avatar_url | Optional, URL |

### Response (200 OK)

Returns the updated `member` object (same shape as `GET /members/me`).

### Errors

| Code | Condition |
|------|-----------|
| `VALIDATION_ERROR` | Input invalid |
| `ALREADY_EXISTS` | Username (or other unique field) already taken |

### Side Effects

- Updates `updated_at`
- Emits audit event (recommended): `member.profile_updated`

---

## GET /members/me/settings

Get only the member’s settings/preferences.

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

## PUT /members/me/settings

Update member settings/preferences.

### Request

```json
{
  "email_notifications": true,
  "push_notifications": false,
  "newsletter": false
}
```

### Validation

| Field | Rules |
|-------|-------|
| email_notifications | Optional boolean |
| push_notifications | Optional boolean |
| newsletter | Optional boolean |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "settings": {
      "email_notifications": true,
      "push_notifications": false,
      "newsletter": false
    }
  }
}
```

### Side Effects

- Updates `updated_at`
- Emits audit event (recommended): `member.settings_updated`

---

## Behavioral Notes (How the app uses Members)

### Member lifecycle

- **Registration** creates a member with `status=pending`.
- **Email verification** activates the member (`status=active`) and sets `email_verified=true`.
- **KYC** governs eligibility for capital flows (deposits/withdrawals), via `kyc_status`.
- **Roles** grant additional permissions (vetting, operations, admin).

### Relationship to Auth endpoints

- `GET /auth/me` may return a subset of member data plus session/token metadata.
- `GET /members/me` is the canonical “member profile” read.

---

## Implementation Notes (for developers)

- MongoDB collection: `members` (`Member.TableName()` returns `members`).
- Unique index expected on: `email` (and typically also `username`).
- Common query indexes expected on: `status`, `kyc_status`, `roles`.
- Keep response format consistent with `docs/apis/00-api-conventions.md`.
