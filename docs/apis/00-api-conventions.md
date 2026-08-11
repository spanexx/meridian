# API Conventions

## Base URL

```
Production: https://api.meridian.com/api/v1
Staging:    https://api.staging.meridian.com/api/v1
Development: http://localhost:8080/api/v1
```

---

## Request Format

### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-ID: <unique-request-id>
X-Idempotency-Key: <idempotency-key>  # For mutations
```

### Request Body
All request bodies are JSON:
```json
{
  "field_name": "value",
  "nested": {
    "field": "value"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:00:00Z"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "summary": { ... }  // Optional aggregates
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:00:00Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Retrieve resources |
| `POST` | Create resources, trigger actions |
| `PUT` | Full resource update |
| `PATCH` | Partial resource update |
| `DELETE` | Remove resources |

---

## Status Codes

### Success Codes
| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST creating resource |
| `204` | No Content | Successful DELETE |

### Client Error Codes
| Code | Meaning | Usage |
|------|---------|-------|
| `400` | Bad Request | Invalid input, validation failure |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Authenticated but not permitted |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate or state conflict |
| `422` | Unprocessable | Business logic error |
| `429` | Too Many Requests | Rate limit exceeded |

### Server Error Codes
| Code | Meaning | Usage |
|------|---------|-------|
| `500` | Internal Error | Unexpected server error |
| `502` | Bad Gateway | Upstream service error |
| `503` | Service Unavailable | Maintenance or overload |

---

## Error Codes

### Authentication Errors
| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | No Authorization header |
| `AUTH_TOKEN_INVALID` | 401 | Token malformed or signature invalid |
| `AUTH_TOKEN_EXPIRED` | 401 | Token has expired |
| `AUTH_REFRESH_INVALID` | 401 | Refresh token invalid or revoked |
| `AUTH_2FA_REQUIRED` | 401 | Two-factor authentication required |
| `AUTH_2FA_INVALID` | 401 | Invalid 2FA code |

### Authorization Errors
| Code | HTTP | Description |
|------|------|-------------|
| `FORBIDDEN` | 403 | Not permitted for this action |
| `KYC_REQUIRED` | 403 | KYC verification required |
| `ROLE_REQUIRED` | 403 | Missing required role |
| `ACCOUNT_SUSPENDED` | 403 | Account has been suspended |

### Validation Errors
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_FORMAT` | 400 | Field format invalid |
| `REQUIRED_FIELD` | 400 | Required field missing |
| `INVALID_ENUM` | 400 | Value not in allowed set |

### Resource Errors
| Code | HTTP | Description |
|------|------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Duplicate resource |
| `CONFLICT` | 409 | State conflict |
| `STALE_DATA` | 409 | Concurrent modification |

### Business Logic Errors
| Code | HTTP | Description |
|------|------|-------------|
| `INSUFFICIENT_BALANCE` | 422 | Not enough funds |
| `LIMIT_EXCEEDED` | 422 | Limit exceeded |
| `INVALID_STATE` | 422 | Operation not valid in current state |
| `COOLDOWN_ACTIVE` | 422 | Action in cooldown period |

### Rate Limiting
| Code | HTTP | Description |
|------|------|-------------|
| `RATE_LIMITED` | 429 | Too many requests |

---

## Pagination

### Query Parameters
```
GET /api/v1/opportunities?page=1&limit=20&sort=created_at&order=desc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max 100) |
| `sort` | string | varies | Field to sort by |
| `order` | string | desc | Sort order (asc/desc) |

### Cursor Pagination (For Large Datasets)
```
GET /api/v1/transactions?cursor=eyJpZCI6IjEyMyJ9&limit=50
```

Response includes next cursor:
```json
{
  "data": {
    "items": [ ... ]
  },
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6IjEyMyJ9",
      "next_cursor": "eyJpZCI6IjE3MyJ9",
      "has_more": true
    }
  }
}
```

---

## Filtering

### Query String Filters
```
GET /api/v1/opportunities?status=APPROVED&category=RETAIL_ARBITRAGE
```

### Multiple Values
```
GET /api/v1/opportunities?status=APPROVED,VETTING&category=RETAIL_ARBITRAGE,LIQUIDATION
```

### Date Ranges
```
GET /api/v1/transactions?from=2026-03-01&to=2026-03-13
```

### Numeric Ranges
```
GET /api/v1/opportunities?min_roi=20&max_roi=100
```

---

## Idempotency

Mutation endpoints (POST, PUT, PATCH, DELETE) support idempotency keys to prevent duplicate operations.

### Usage
```http
POST /api/v1/capital/deposits
X-Idempotency-Key: dep_user123_1710324000
Content-Type: application/json

{"amount": "5000.00", "payment_method": "CARD"}
```

### Behavior
1. First request with key: Processed normally
2. Duplicate request with same key within 24h: Returns cached response
3. Key expires after 24 hours

### Key Format
Recommended: `{operation}_{user}_{timestamp}`
Example: `dep_user123_1710324000`

---

## Rate Limiting

### Default Limits
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Read (GET) | 100 | 1 minute |
| Write (POST/PUT) | 30 | 1 minute |
| Auth | 10 | 1 minute |

### Tier-Based Limits
| Tier | Read/min | Write/min |
|------|----------|-----------|
| BRONZE | 60 | 20 |
| SILVER | 100 | 30 |
| GOLD | 200 | 50 |
| PLATINUM | 500 | 100 |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1710324060
```

### Rate Limit Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "window_seconds": 60,
      "retry_after": 15
    }
  }
}
```

---

## Authentication

### Access Token
- Type: JWT
- Lifetime: 15 minutes
- Usage: `Authorization: Bearer <token>`

### Token Payload
```json
{
  "sub": "mem_507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "roles": ["MEMBER", "VETTER"],
  "iat": 1710324000,
  "exp": 1710324900
}
```

### Refresh Token
- Lifetime: 7 days
- Rotation: Issued new on each use
- Revocable: Yes

### Token Refresh
```
POST /api/v1/auth/refresh
Content-Type: application/json

{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}
```

---

## Versioning

API versioned via URL path:
```
/api/v1/...
/api/v2/...  (future)
```

### Deprecation
- Deprecated endpoints return `X-Deprecated: true` header
- Minimum 6-month notice before removal
- Migration guide provided in docs

---

## WebSocket

### Connection
```
wss://api.meridian.com/ws?token=<access_token>
```

### Message Format
```json
{
  "type": "SUBSCRIBE",
  "channel": "execution:exec_123",
  "data": {}
}
```

### Event Types
| Type | Description |
|------|-------------|
| `SUBSCRIBE` | Subscribe to channel |
| `UNSUBSCRIBE` | Unsubscribe from channel |
| `EVENT` | Server-sent event |
| `ERROR` | Error message |
| `PING` | Keep-alive ping |
| `PONG` | Keep-alive response |

### Channels
| Channel | Events |
|---------|--------|
| `pool` | Pool status updates |
| `execution:{id}` | Execution progress |
| `member:{id}` | Member notifications |
| `opportunity:{id}` | Vetting progress |

---

## Field Conventions

### Naming
- Snake_case for JSON fields
- CamelCase for Go structs
- Consistent across all endpoints

### Dates
ISO 8601 format: `2026-03-13T10:00:00Z`

### Money
- String type for precision: `"5000.00"`
- Always include cents: `"100.00"` not `"100"`
- No currency symbol in values

### IDs
- String type
- Prefixed by type: `mem_`, `opp_`, `exec_`, `pay_`

### Booleans
- Explicit `true` or `false`
- Never null for boolean fields

### Enums
- UPPER_SNAKE_CASE
- Documented allowed values
- Validation on input

---

## Example Request/Response

### Request
```http
POST /api/v1/opportunities HTTP/1.1
Host: api.meridian.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
X-Request-ID: req_abc123
X-Idempotency-Key: opp_user123_1710324000

{
  "title": "Best Buy Clearance - 4K TVs",
  "category": "RETAIL_ARBITRAGE",
  "details": {
    "source": {
      "name": "Best Buy",
      "location": "Austin, TX"
    },
    "acquisition": {
      "estimated_cost": 8500,
      "quantity": 15
    }
  }
}
```

### Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
X-Request-ID: req_abc123
X-RateLimit-Remaining: 29

{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "title": "Best Buy Clearance - 4K TVs",
    "status": "DRAFT",
    "created_at": "2026-03-13T10:00:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:00:00Z"
  }
}
```
