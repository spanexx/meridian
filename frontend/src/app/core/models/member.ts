/**
 * Member models — canonical API shapes.
 *
 * Sources: docs/apis/members.md (GET /members/me, settings) and
 * docs/apis/01-auth-api.md (GET /auth/me, login member). Two variants
 * exist with different casing/id conventions; both are preserved with
 * their source annotated (extraction gaps §4.8, §4.11).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Member account status — lowercase per docs/apis/members.md. */
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'suspended';

/** Member roles — UPPER_SNAKE per members.md. */
export type MemberRole = 'MEMBER' | 'VETTER' | 'OPERATOR' | 'ADMIN';

/** KYC lifecycle values — UPPER_SNAKE per members.md. */
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Contribution kinds — lowercase per docs/apis/05-community-api.md. */
export type ContributionType = 'capital' | 'signal' | 'access' | 'operator' | 'admin';

/**
 * Contribution types from GET /auth/me — UPPER_SNAKE, conflicting with
 * the lowercase set above (extraction gap §4.8). Kept as a separate
 * literal so call sites are explicit about which vocabulary they speak.
 */
export type ContributionTypeAuth = 'CAPITAL' | 'SIGNAL';

/** Reputation tiers — BRONZE/SILVER/GOLD/PLATINUM per journey 06 tier table. */
export type ReputationTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

/** Member notification preferences (docs/apis/members.md settings). */
export interface NotificationPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter: boolean;
}

/** Member profile — GET /members/me (id is a plain hex ObjectId per members.md). */
export interface Member {
  id: string;
  full_name: string;
  username: string;
  email: string;
  status: MemberStatus;
  email_verified: boolean;
  two_factor_enabled: boolean;
  roles: MemberRole[];
  kyc_status: KycStatus;
  profile: {
    first_name: string;
    last_name: string;
    display_name: string;
    phone: string;
    country: string;
    timezone: string;
    avatar_url: string;
  };
  settings: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

/** Member subset returned by GET /auth/me (ids prefixed mem_, status UPPER_SNAKE). */
export interface AuthMeMember {
  id: string;
  email: string;
  status: string;
  profile: { first_name: string; last_name: string; display_name: string };
  roles: MemberRole[];
  kyc_status: KycStatus;
  two_factor_enabled: boolean;
  contribution_types: ContributionTypeAuth[];
  created_at: string;
  last_login_at: string;
}

/** Login response member object (docs/apis/01-auth-api.md POST /auth/login). */
export interface LoginMember {
  id: string;
  email: string;
  status: string;
  roles: MemberRole[];
  kyc_status: KycStatus;
  two_factor_enabled: boolean;
}

/** Token pair + member returned by login/refresh flows. */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** POST /auth/login success payload. */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  member: LoginMember;
}

/** POST /auth/login payload when the account requires 2FA. */
export interface TwoFactorChallenge {
  requires_2fa: true;
  temp_token: string;
  message: string;
}

/** POST /auth/login/2fa payload. */
export type TwoFactorLoginResponse = AuthTokens;

/** POST /auth/2fa/setup payload (initiates enrollment, returns a secret). */
export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  manual_entry: { account: string; issuer: string };
  backup_codes: string[];
}

/** POST /auth/2fa/verify + /auth/2fa/disable payload. */
export interface TwoFactorStatusResponse {
  two_factor_enabled: boolean;
  message: string;
}


/** POST /auth/register payload. */
export interface RegisterResponse {
  member_id: string;
  email: string;
  status: string;
  message: string;
}