# Journey: Member Registration

## Story

> **As a potential contributor**, I want to create an account so that I can participate in the collective and start contributing capital, signals, or access.

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │  Sign   │───►│ Verify  │───►│ Profile │───►│  KYC    │        │
│   │   Up    │    │  Email  │    │  Setup  │    │ (Later) │        │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│                                                                     │
│   User enters    User clicks    User adds      Required for        │
│   email, pass    link in        name, phone,   capital ops         │
│                  email          country                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Sign Up Form

### User Action
User navigates to `/register` and fills out the registration form.

### Required Fields
| Field | Validation | Error Message |
|-------|------------|---------------|
| `email` | Valid email format, unique | "Invalid email" / "Email already registered" |
| `password` | Min 8 chars, 1 upper, 1 lower, 1 number | "Password must be at least 8 characters with mixed case and numbers" |
| `password_confirm` | Matches password | "Passwords do not match" |
| `terms_accepted` | Must be true | "You must accept the terms of service" |

### API Call
```
POST /api/v1/auth/register
```

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "terms_accepted": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "member_id": "507f1f77bcf86cd799439011",
    "email": "jane@example.com",
    "status": "PENDING",
    "message": "Verification email sent. Please check your inbox."
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email already registered"
    }
  }
}
```

### Backend Behavior
1. Validate all input fields
2. Check email uniqueness in `members` collection
3. Hash password with bcrypt (cost factor 12)
4. Create member document with `status: "PENDING"`
5. Generate email verification token (JWT, 24h expiry)
6. Queue email job to `notification-send` queue
7. Log audit event: `member.registered`
8. Return success response

### Database Changes
```javascript
// New document in 'members' collection
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "jane@example.com",
  "password_hash": "$2a$12$...",
  "status": "PENDING",
  "profile": {},
  "roles": ["MEMBER"],
  "kyc_status": "NOT_STARTED",
  "contribution_types": [],
  "settings": {
    "email_notifications": true,
    "push_notifications": true,
    "newsletter": false
  },
  "created_at": ISODate("2026-03-13T10:00:00Z"),
  "updated_at": ISODate("2026-03-13T10:00:00Z")
}

// New document in 'capital_accounts' collection
{
  "member_id": ObjectId("507f1f77bcf86cd799439011"),
  "balances": {
    "available": NumberDecimal("0"),
    "locked": NumberDecimal("0"),
    "pending_deposit": NumberDecimal("0"),
    "pending_withdrawal": NumberDecimal("0")
  },
  "lifetime": {
    "total_deposited": NumberDecimal("0"),
    "total_withdrawn": NumberDecimal("0"),
    "total_earned": NumberDecimal("0"),
    "total_deployed": NumberDecimal("0")
  },
  "currency": "USD",
  "withdrawal_methods": [],
  "created_at": ISODate("2026-03-13T10:00:00Z")
}

// New document in 'reputation_scores' collection
{
  "member_id": ObjectId("507f1f77bcf86cd799439011"),
  "overall_score": 0,
  "tier": "BRONZE",
  "signal_score": { "score": 0, ... },
  "capital_score": { "score": 0, ... },
  "access_score": { "score": 0, ... },
  "community_score": { "score": 0, ... },
  "privileges": {
    "can_vet": false,
    "can_operate": false,
    "signal_share_bonus": 0,
    "capital_share_bonus": 0
  },
  "created_at": ISODate("2026-03-13T10:00:00Z")
}
```

---

## Step 2: Email Verification

### User Action
User clicks the verification link in their email.

### Link Format
```
https://app.meridian.com/verify-email?token=eyJhbGciOiJIUzI1NiIs...
```

### API Call
```
POST /api/v1/auth/verify-email
```

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Verification link is invalid or expired"
  }
}
```

### Backend Behavior
1. Decode and validate JWT token
2. Check token not expired (24h limit)
3. Find member by ID in token
4. Update member `status` to "ACTIVE"
5. Update `email_verified_at` timestamp
6. Generate access token and refresh token
7. Log audit event: `member.email_verified`
8. Return tokens for immediate login

### Database Changes
```javascript
// Update 'members' collection
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "status": "ACTIVE",                              // changed from PENDING
  "email_verified_at": ISODate("2026-03-13T10:05:00Z")
}
```

---

## Step 3: Profile Setup

### User Action
After email verification, user is prompted to complete their profile.

### Required Fields
| Field | Validation | Required |
|-------|------------|----------|
| `first_name` | 1-50 chars | Yes |
| `last_name` | 1-50 chars | Yes |
| `display_name` | 3-30 chars, unique | No |
| `phone` | Valid phone format | No |
| `country` | Valid ISO country code | Yes |
| `timezone` | Valid timezone | No |

### API Call
```
PUT /api/v1/members/me/profile
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "display_name": "janedoe",
  "phone": "+1234567890",
  "country": "US",
  "timezone": "America/New_York"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "member_id": "507f1f77bcf86cd799439011",
    "profile": {
      "first_name": "Jane",
      "last_name": "Doe",
      "display_name": "janedoe",
      "phone": "+1234567890",
      "country": "US",
      "timezone": "America/New_York"
    },
    "profile_complete": true
  }
}
```

### Backend Behavior
1. Validate JWT from Authorization header
2. Validate input fields
3. Check display_name uniqueness (if provided)
4. Update member profile subdocument
5. Log audit event: `member.profile_updated`
6. Return updated profile

### Database Changes
```javascript
// Update 'members' collection
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "profile": {
    "first_name": "Jane",
    "last_name": "Doe",
    "display_name": "janedoe",
    "phone": "+1234567890",
    "country": "US",
    "timezone": "America/New_York"
  },
  "updated_at": ISODate("2026-03-13T10:10:00Z")
}
```

---

## Step 4: Choose Contribution Type (Optional)

### User Action
User indicates how they plan to contribute.

### API Call
```
PUT /api/v1/members/me/contribution-types
```

**Request:**
```json
{
  "contribution_types": ["CAPITAL", "SIGNAL"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "contribution_types": ["CAPITAL", "SIGNAL"],
    "next_steps": {
      "CAPITAL": "Complete KYC to deposit funds",
      "SIGNAL": "Ready to submit opportunities"
    }
  }
}
```

### Backend Behavior
1. Validate contribution types (valid enum values)
2. Update member contribution_types array
3. If "CAPITAL" selected, prompt for KYC

---

## Post-Registration State

After completing registration, the member is in this state:

| Attribute | Value |
|-----------|-------|
| Status | ACTIVE |
| KYC Status | NOT_STARTED |
| Capital Balance | $0.00 |
| Reputation Tier | BRONZE |
| Can submit signals | Yes |
| Can deposit capital | Requires KYC |
| Can vote on opportunities | No (requires tier upgrade) |

---

## Edge Cases & Error Handling

### Duplicate Email
If email already exists:
- Return 400 with clear error message
- Do not reveal if email is verified or not (security)

### Expired Verification Link
If user clicks expired link:
- Return 400 with clear error
- Provide "Resend verification email" option

### Resend Verification Email
```
POST /api/v1/auth/resend-verification
```
**Request:**
```json
{
  "email": "jane@example.com"
}
```
- Rate limited: 1 per 5 minutes
- Only works for PENDING status members

---

## Related Notifications

| Event | Notification Type | Channels |
|-------|-------------------|----------|
| Registration complete | `WELCOME` | Email |
| Email verified | `EMAIL_VERIFIED` | In-app |
| Profile completed | `PROFILE_COMPLETE` | In-app |

---

## Audit Trail

Events logged during registration:
```javascript
// member.registered
{
  "action": "member.registered",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "member", "id": "507f..." },
  "details": { "email": "jane@example.com" }
}

// member.email_verified
{
  "action": "member.email_verified",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "member", "id": "507f..." }
}

// member.profile_updated
{
  "action": "member.profile_updated",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "member", "id": "507f..." },
  "details": { 
    "after": { "first_name": "Jane", "last_name": "Doe", ... }
  }
}
```

---

## Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `RegisterFormComponent` | `/auth/register` | Registration form |
| `VerifyEmailComponent` | `/verify-email` | Verification landing |
| `ProfileSetupComponent` | `/onboarding/profile` | Profile completion |
| `ContributionTypeComponent` | `/onboarding/contribution` | Type selection |

---

## Security Considerations

1. **Password Storage**: bcrypt with cost factor 12
2. **Token Security**: Verification tokens are single-use
3. **Rate Limiting**: 
   - Registration: 5 per IP per hour
   - Verification resend: 1 per email per 5 minutes
4. **Input Sanitization**: All inputs sanitized before storage
5. **Audit Logging**: All steps logged for compliance
