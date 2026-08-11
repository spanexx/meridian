# Auth API

## Overview

Authentication endpoints for member registration, login, token management, and password operations.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new member |
| POST | `/auth/login` | Authenticate and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke tokens |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/change-password` | Change password (authenticated) |
| GET | `/auth/me` | Get current member info |
| POST | `/auth/2fa/setup` | Initialize 2FA setup |
| POST | `/auth/2fa/verify` | Verify and enable 2FA |
| POST | `/auth/2fa/disable` | Disable 2FA |

---

## POST /auth/register

Register a new member account.

### Story
> As a visitor, I want to create an account so I can participate in the collective.

### Request
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "terms_accepted": true
}
```

### Validation
| Field | Rules |
|-------|-------|
| email | Required, valid email format, unique |
| password | Required, min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| password_confirm | Required, must match password |
| terms_accepted | Required, must be true |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "member_id": "mem_507f1f77bcf86cd799439011",
    "email": "jane@example.com",
    "status": "PENDING",
    "message": "Verification email sent. Please check your inbox."
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `VALIDATION_ERROR` | Input validation failed |
| `ALREADY_EXISTS` | Email already registered |
| `TERMS_NOT_ACCEPTED` | Terms not accepted |

### Side Effects
- Creates member with PENDING status
- Creates capital account (zero balance)
- Creates reputation score (zero)
- Sends verification email
- Logs: `member.registered`

---

## POST /auth/login

Authenticate member and receive tokens.

### Story
> As a registered member, I want to log in so I can access my account.

### Request
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "member": {
      "id": "mem_507f1f77bcf86cd799439011",
      "email": "jane@example.com",
      "status": "ACTIVE",
      "roles": ["MEMBER"],
      "kyc_status": "VERIFIED",
      "two_factor_enabled": false
    }
  }
}
```

### Response (2FA Required)
```json
{
  "success": true,
  "data": {
    "requires_2fa": true,
    "temp_token": "eyJhbGciOiJIUzI1NiIs...",
    "message": "Please enter your 2FA code"
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `ACCOUNT_PENDING` | Email not verified |
| `ACCOUNT_SUSPENDED` | Account suspended |
| `ACCOUNT_BANNED` | Account banned |

### Side Effects
- Updates `last_login_at`
- Creates session record
- Logs: `member.login`

---

## POST /auth/login/2fa

Complete login with 2FA code.

### Request
```json
{
  "temp_token": "eyJhbGciOiJIUzI1NiIs...",
  "code": "123456"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `AUTH_2FA_INVALID` | Invalid 2FA code |
| `AUTH_TOKEN_EXPIRED` | Temp token expired |

---

## POST /auth/refresh

Refresh access token using refresh token.

### Story
> As a logged-in member, I want my session to stay active without re-entering credentials.

### Request
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

### Behavior
- Old refresh token is invalidated (rotation)
- New refresh token issued
- New access token issued

### Errors
| Code | Condition |
|------|-----------|
| `AUTH_REFRESH_INVALID` | Refresh token invalid or revoked |
| `AUTH_TOKEN_EXPIRED` | Refresh token expired |

---

## POST /auth/logout

Revoke current session tokens.

### Story
> As a logged-in member, I want to log out to secure my account.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

### Side Effects
- Refresh token revoked
- Access token blacklisted
- Session record deleted
- Logs: `member.logout`

---

## POST /auth/verify-email

Verify email address using token from email.

### Request
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Behavior
- Updates member status to ACTIVE
- Sets `email_verified_at`
- Issues tokens for immediate login
- Logs: `member.email_verified`

### Errors
| Code | Condition |
|------|-----------|
| `INVALID_TOKEN` | Token invalid or expired |
| `ALREADY_VERIFIED` | Email already verified |

---

## POST /auth/resend-verification

Resend verification email.

### Request
```json
{
  "email": "jane@example.com"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent if account exists"
  }
}
```

### Rate Limit
- 1 request per 5 minutes per email

### Behavior
- Only works for PENDING status accounts
- Response is same whether email exists or not (security)

---

## POST /auth/forgot-password

Request password reset email.

### Request
```json
{
  "email": "jane@example.com"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent if account exists"
  }
}
```

### Rate Limit
- 3 requests per hour per email

### Side Effects
- Sends password reset email (if account exists)
- Logs: `member.password_reset_requested`

---

## POST /auth/reset-password

Reset password using token from email.

### Request
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "password": "NewSecurePass123!",
  "password_confirm": "NewSecurePass123!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### Side Effects
- Updates password hash
- Revokes all existing sessions
- Logs: `member.password_reset`

### Errors
| Code | Condition |
|------|-----------|
| `INVALID_TOKEN` | Token invalid or expired |
| `VALIDATION_ERROR` | Password doesn't meet requirements |

---

## POST /auth/change-password

Change password for authenticated member.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!",
  "new_password_confirm": "NewSecurePass123!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

### Side Effects
- Updates password hash
- Revokes all other sessions (keeps current)
- 24-hour withdrawal hold activated
- Logs: `member.password_changed`

### Errors
| Code | Condition |
|------|-----------|
| `INVALID_CREDENTIALS` | Current password wrong |
| `VALIDATION_ERROR` | New password doesn't meet requirements |

---

## GET /auth/me

Get current authenticated member info.

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "mem_507f1f77bcf86cd799439011",
      "email": "jane@example.com",
      "status": "ACTIVE",
      "profile": {
        "first_name": "Jane",
        "last_name": "Doe",
        "display_name": "janedoe"
      },
      "roles": ["MEMBER", "VETTER"],
      "kyc_status": "VERIFIED",
      "two_factor_enabled": true,
      "contribution_types": ["CAPITAL", "SIGNAL"],
      "created_at": "2026-01-15T10:00:00Z",
      "last_login_at": "2026-03-13T08:00:00Z"
    },
    "session": {
      "created_at": "2026-03-13T08:00:00Z",
      "expires_at": "2026-03-13T08:15:00Z"
    }
  }
}
```

---

## POST /auth/2fa/setup

Initialize 2FA setup and get QR code.

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code_url": "data:image/png;base64,...",
    "manual_entry": {
      "account": "jane@example.com",
      "issuer": "MERIDIAN"
    },
    "backup_codes": [
      "a1b2c3d4",
      "e5f6g7h8",
      "i9j0k1l2",
      "m3n4o5p6",
      "q7r8s9t0"
    ]
  }
}
```

### Note
- Backup codes shown only once
- User must save them securely
- 2FA not active until verified

---

## POST /auth/2fa/verify

Verify 2FA code and activate.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "code": "123456"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "two_factor_enabled": true,
    "message": "Two-factor authentication enabled"
  }
}
```

### Side Effects
- Sets `two_factor_enabled: true`
- Stores encrypted secret
- Logs: `member.2fa_enabled`

---

## POST /auth/2fa/disable

Disable 2FA (requires current 2FA code).

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "code": "123456",
  "password": "CurrentPass123!"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "two_factor_enabled": false,
    "message": "Two-factor authentication disabled"
  }
}
```

### Side Effects
- Sets `two_factor_enabled: false`
- Removes secret
- 24-hour withdrawal hold activated
- Logs: `member.2fa_disabled`

---

## Implementation Notes

### Password Hashing
```go
func hashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
    return string(bytes), err
}

func checkPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

### Token Generation
```go
func generateAccessToken(member *Member) (string, error) {
    claims := jwt.MapClaims{
        "sub":   member.ID,
        "email": member.Email,
        "roles": member.Roles,
        "iat":   time.Now().Unix(),
        "exp":   time.Now().Add(15 * time.Minute).Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(config.JWTSecret))
}
```

### Rate Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/login | 5 | 15 min |
| /auth/register | 3 | 1 hour |
| /auth/forgot-password | 3 | 1 hour |
| /auth/resend-verification | 1 | 5 min |
