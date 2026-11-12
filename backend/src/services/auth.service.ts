import { DataSource, Repository } from 'typeorm';
import { User, Plan, RefreshToken, AuditLog, FileEntity, Folder } from '../database/entities/index.js';
import { AppDataSource } from '../database/data-source.js';
import {
  hashAuthKey,
  compareAuthKey,
  deriveDeterministicSalt,
  generateRandomHex
} from '../utils/password.js';
import {
  signAccessToken,
  generateRefreshTokenString,
  hashToken,
  calculateRefreshTokenExpiry
} from '../utils/token.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';

export interface RegisterDTO {
  email: string;
  authKey: string; // 64 hex characters (32 bytes derived from password)
  salt: string; // 32 hex characters (16 bytes user salt)
  kdf_version?: string;
  kdf_params?: { m: number; t: number; p: number };
  encrypted_master_key: string;
  master_key_nonce: string;
  encrypted_recovery_master_key: string;
  recovery_master_key_nonce: string;
  format_version?: number;
}

export interface ClientMetadata {
  ip?: string;
  userAgent?: string;
  deviceName?: string;
}

export class AuthService {
  private userRepo: Repository<User>;
  private planRepo: Repository<Plan>;
  private tokenRepo: Repository<RefreshToken>;
  private auditRepo: Repository<AuditLog>;
  private fileRepo: Repository<FileEntity>;
  private folderRepo: Repository<Folder>;

  constructor(dataSource: DataSource = AppDataSource) {
    this.userRepo = dataSource.getRepository(User);
    this.planRepo = dataSource.getRepository(Plan);
    this.tokenRepo = dataSource.getRepository(RefreshToken);
    this.auditRepo = dataSource.getRepository(AuditLog);
    this.fileRepo = dataSource.getRepository(FileEntity);
    this.folderRepo = dataSource.getRepository(Folder);
  }

  /**
   * Pre-Login Endpoint: Anti-User Enumeration
   * Always returns identical response schema and timing whether user exists or not.
   */
  async prelogin(email: string): Promise<{ kdf_version: string; kdf_params: { m: number; t: number; p: number }; salt: string }> {
    const normalized = email.trim().toLowerCase();
    let user: User | null = null;
    try {
      user = await this.userRepo.findOne({ where: { email: normalized } });
    } catch {
      // If DB is offline/uninitialized, fail-safe to deterministic fake salt to prevent enumeration
      user = null;
    }

    if (user) {
      return {
        kdf_version: user.kdf_version,
        kdf_params: user.kdf_params,
        salt: user.salt
      };
    }

    // Deterministic fake salt for unknown emails (timing & format parity)
    const fakeSalt = deriveDeterministicSalt(normalized);
    return {
      kdf_version: '1.0',
      kdf_params: { m: 65536, t: 3, p: 1 },
      salt: fakeSalt
    };
  }

  /**
   * User Registration with Zero-Knowledge Envelope Blobs
   */
  async register(data: RegisterDTO, clientInfo: ClientMetadata = {}): Promise<{ user: Partial<User>; message: string }> {
    const normalized = data.email.trim().toLowerCase();

    // 1. Validation of format and lengths
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestError('Invalid email address format');
    }
    if (!data.authKey || data.authKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(data.authKey)) {
      throw new BadRequestError('authKey must be a 64-character hex string (32 bytes)');
    }
    if (!data.salt || data.salt.length !== 32 || !/^[0-9a-fA-F]+$/.test(data.salt)) {
      throw new BadRequestError('salt must be a 32-character hex string (16 bytes)');
    }
    if (!data.encrypted_master_key || !data.master_key_nonce) {
      throw new BadRequestError('Missing wrapped master key or nonce');
    }
    if (!data.encrypted_recovery_master_key || !data.recovery_master_key_nonce) {
      throw new BadRequestError('Missing recovery-wrapped master key or nonce');
    }

    // 2. Check existing user
    const existing = await this.userRepo.findOne({ where: { email: normalized } });
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    // 3. Hash AuthKey with bcrypt (cost factor 12 + server-side pepper)
    const authKeyHash = await hashAuthKey(data.authKey);

    // 4. Assign default Free Plan (5 GiB)
    const freePlan = await this.planRepo.findOne({ where: { name: 'Free' } });

    // 5. Generate email verification token
    const verificationToken = generateRandomHex(32);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = this.userRepo.create({
      email: normalized,
      auth_key_hash: authKeyHash,
      salt: data.salt.toLowerCase(),
      kdf_version: data.kdf_version || '1.0',
      kdf_params: data.kdf_params || { m: 65536, t: 3, p: 1 },
      encrypted_master_key: data.encrypted_master_key,
      master_key_nonce: data.master_key_nonce,
      encrypted_recovery_master_key: data.encrypted_recovery_master_key,
      recovery_master_key_nonce: data.recovery_master_key_nonce,
      storage_quota_bytes: freePlan ? freePlan.quota_bytes : '5368709120',
      plan: freePlan,
      email_verification_token: verificationToken,
      email_verification_expires_at: verificationExpires
    });

    await this.userRepo.save(user);

    // 6. Audit Log
    await this.recordAudit(user.id, 'AUTH_REGISTER', 'SUCCESS', clientInfo, { plan: 'Free' });

    // 7. Dispatch verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        kdf_version: user.kdf_version,
        created_at: user.created_at
      },
      message: 'Account created successfully. Please verify your email.'
    };
  }

  /**
   * User Login: Dual-Key Argon2id over TLS Verification
   */
  async login(
    email: string,
    authKey: string,
    clientInfo: ClientMetadata = {}
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    encrypted_master_key: string;
    master_key_nonce: string;
    encrypted_recovery_master_key: string;
    recovery_master_key_nonce: string;
    kdf_version: string;
    kdf_params: { m: number; t: number; p: number };
  }> {
    const normalized = email.trim().toLowerCase();
    let user: User | null = null;
    try {
      user = await this.userRepo.findOne({ where: { email: normalized } });
    } catch {
      // If DB is offline/uninitialized, fail-safe to generic response
      user = null;
    }

    // Enforce exponential lockout check
    if (user?.lockout_until && user.lockout_until > new Date()) {
      const waitSeconds = Math.ceil((user.lockout_until.getTime() - Date.now()) / 1000);
      throw new TooManyRequestsError(
        `Account temporarily locked due to multiple failed attempts. Please retry in ${waitSeconds} seconds.`
      );
    }

    if (!user) {
      // Dummy compare to avoid timing side-channel
      await compareAuthKey(authKey, '$2a$12$e80yvVfZ/v5sF6N4M6k1hOBc8.3E2wJ5x8zZ9o2l4.8W1o1fXyWre');
      throw new UnauthorizedError('Invalid email or credentials');
    }

    const isValid = await compareAuthKey(authKey, user.auth_key_hash);
    if (!isValid) {
      const attempts = user.failed_login_attempts + 1;
      let lockoutUntil: Date | null = null;
      if (attempts >= 5) {
        // Exponential backoff: 30s * 2^(attempts - 5), capped at 3600s (1 hour)
        const backoffSeconds = Math.min(3600, 30 * Math.pow(2, attempts - 5));
        lockoutUntil = new Date(Date.now() + backoffSeconds * 1000);
        await emailService.sendSecurityAlert(
          user.email,
          `Multiple failed login attempts detected (${attempts}). Account locked for ${backoffSeconds} seconds.`
        );
      }
      await this.userRepo.update(user.id, {
        failed_login_attempts: attempts,
        lockout_until: lockoutUntil
      });
      await this.recordAudit(user.id, 'AUTH_LOGIN', 'FAILURE', clientInfo, { attempts, lockoutUntil });
      throw new UnauthorizedError('Invalid email or credentials');
    }

    // Reset failed login attempts on success
    if (user.failed_login_attempts > 0 || user.lockout_until) {
      await this.userRepo.update(user.id, {
        failed_login_attempts: 0,
        lockout_until: null
      });
    }

    // Generate JWT access token & fresh refresh token family
    const accessToken = await signAccessToken(user.id, user.email);
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashToken(refreshTokenString);
    const familyId = crypto.randomUUID();

    const refreshTokenEntity = this.tokenRepo.create({
      user,
      token_hash: tokenHash,
      family_id: familyId,
      device_name: clientInfo.deviceName || 'Web Browser',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      expires_at: calculateRefreshTokenExpiry()
    });
    await this.tokenRepo.save(refreshTokenEntity);

    await this.recordAudit(user.id, 'AUTH_LOGIN', 'SUCCESS', clientInfo, { family_id: familyId });

    return {
      user: {
        id: user.id,
        email: user.email,
        storage_used_bytes: user.storage_used_bytes,
        storage_quota_bytes: user.storage_quota_bytes,
        recovery_confirmed_at: user.recovery_confirmed_at,
        is_email_verified: user.is_email_verified
      },
      accessToken,
      refreshToken: refreshTokenString,
      encrypted_master_key: user.encrypted_master_key,
      master_key_nonce: user.master_key_nonce,
      encrypted_recovery_master_key: user.encrypted_recovery_master_key,
      recovery_master_key_nonce: user.recovery_master_key_nonce,
      kdf_version: user.kdf_version,
      kdf_params: user.kdf_params
    };
  }

  /**
   * Refresh Token with Automatic Rotation & Family Reuse Detection
   */
  async refresh(
    refreshTokenString: string,
    clientInfo: ClientMetadata = {}
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(refreshTokenString);
    const existing = await this.tokenRepo.findOne({
      where: { token_hash: tokenHash },
      relations: ['user']
    });

    if (!existing) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // REUSE DETECTION: If token is already revoked, check for concurrent tab grace window
    if (existing.is_revoked) {
      const gracePeriodMs = 10000; // 10 seconds
      const revokedAt = existing.last_used_at ? new Date(existing.last_used_at).getTime() : 0;
      if (Date.now() - revokedAt <= gracePeriodMs) {
        logger.info(
          { userId: existing.user.id, familyId: existing.family_id },
          'Refresh token hit within 10s grace window (concurrent browser tab); reissuing access token.'
        );
        const accessToken = await signAccessToken(existing.user.id, existing.user.email);
        return { accessToken, refreshToken: refreshTokenString };
      }

      logger.warn(
        { userId: existing.user.id, familyId: existing.family_id },
        'SECURITY ALERT: Refresh token reuse detected outside grace window! Revoking entire family.'
      );
      // Revoke all tokens in the entire family and zero out grace timestamp
      await this.tokenRepo.update(
        { family_id: existing.family_id },
        { is_revoked: true, last_used_at: new Date(0) }
      );
      await this.recordAudit(existing.user.id, 'TOKEN_REUSE_DETECTED', 'FAILURE', clientInfo, {
        family_id: existing.family_id
      });
      throw new UnauthorizedError('Refresh token reuse detected. All sessions in family revoked.');
    }

    if (existing.expires_at < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // 1. Invalidate current token and stamp revocation timestamp
    existing.is_revoked = true;
    existing.last_used_at = new Date();
    await this.tokenRepo.save(existing);

    // 2. Issue new rotated token in the same family
    const newRefreshTokenString = generateRefreshTokenString();
    const newHash = hashToken(newRefreshTokenString);

    const rotated = this.tokenRepo.create({
      user: existing.user,
      token_hash: newHash,
      family_id: existing.family_id,
      device_name: clientInfo.deviceName || existing.device_name,
      ip_address: clientInfo.ip || existing.ip_address,
      user_agent: clientInfo.userAgent || existing.user_agent,
      expires_at: calculateRefreshTokenExpiry()
    });
    await this.tokenRepo.save(rotated);

    // 3. Issue fresh access token
    const accessToken = await signAccessToken(existing.user.id, existing.user.email);

    return {
      accessToken,
      refreshToken: newRefreshTokenString
    };
  }

  /**
   * Logout (Single Session)
   */
  async logout(refreshTokenString: string): Promise<void> {
    const tokenHash = hashToken(refreshTokenString);
    await this.tokenRepo.update({ token_hash: tokenHash }, { is_revoked: true });
  }

  /**
   * Logout All Sessions for User
   */
  async logoutAll(userId: string): Promise<void> {
    await this.tokenRepo.update({ user: { id: userId } }, { is_revoked: true });
  }

  /**
   * Get Active Sessions for User
   */
  async getSessions(userId: string, currentTokenString?: string): Promise<Array<{ id: string; device_name: string; ip_address: string | null; last_used_at: Date; created_at: Date; is_current: boolean }>> {
    const tokens = await this.tokenRepo.find({
      where: { user: { id: userId }, is_revoked: false }
    });

    const currentHash = currentTokenString ? hashToken(currentTokenString) : null;

    return tokens.map((t) => ({
      id: t.id,
      device_name: t.device_name,
      ip_address: t.ip_address,
      last_used_at: t.last_used_at,
      created_at: t.created_at,
      is_current: currentHash ? t.token_hash === currentHash : false
    }));
  }

  /**
   * Revoke Specific Session by ID
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.tokenRepo.findOne({
      where: { id: sessionId, user: { id: userId } }
    });
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    await this.tokenRepo.update({ family_id: session.family_id }, { is_revoked: true });
  }

  /**
   * Confirm Recovery Kit 4-word challenge pass
   */
  async confirmRecoveryChallenge(userId: string): Promise<Date> {
    const now = new Date();
    await this.userRepo.update(userId, { recovery_confirmed_at: now });
    await this.recordAudit(userId, 'RECOVERY_KIT_CONFIRMED', 'SUCCESS', {});
    return now;
  }

  /**
   * Password Change Protocol: Re-wraps Master Key with New KEK without File Re-Encryption
   */
  async changePassword(
    userId: string,
    data: {
      oldAuthKey?: string;
      old_auth_key?: string;
      newAuthKey?: string;
      new_auth_key?: string;
      newSalt?: string;
      new_salt?: string;
      newKdfParams?: { m: number; t: number; p: number };
      new_kdf_params?: { m: number; t: number; p: number };
      newEncryptedMasterKey?: string;
      new_encrypted_master_key?: string;
      newMasterKeyNonce?: string;
      new_master_key_nonce?: string;
      revokeOtherSessions?: boolean;
    },
    clientInfo: ClientMetadata = {}
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const oldAuthKey = data.oldAuthKey || data.old_auth_key;
    const newAuthKey = data.newAuthKey || data.new_auth_key;
    const newSalt = data.newSalt || data.new_salt;
    const newKdfParams = data.newKdfParams || data.new_kdf_params;
    const newEncryptedMasterKey = data.newEncryptedMasterKey || data.new_encrypted_master_key;
    const newMasterKeyNonce = data.newMasterKeyNonce || data.new_master_key_nonce;

    if (!oldAuthKey || !newAuthKey || !newSalt || !newEncryptedMasterKey || !newMasterKeyNonce) {
      throw new BadRequestError('Missing required password change parameters');
    }

    const isValid = await compareAuthKey(oldAuthKey, user.auth_key_hash);
    if (!isValid) {
      await this.recordAudit(userId, 'PASSWORD_CHANGE', 'FAILURE', clientInfo, { reason: 'Invalid old AuthKey' });
      throw new UnauthorizedError('Current password authentication failed');
    }

    const newAuthHash = await hashAuthKey(newAuthKey);
    user.auth_key_hash = newAuthHash;
    user.salt = newSalt.toLowerCase();
    if (newKdfParams) user.kdf_params = newKdfParams;
    user.encrypted_master_key = newEncryptedMasterKey;
    user.master_key_nonce = newMasterKeyNonce;

    await this.userRepo.save(user);

    if (data.revokeOtherSessions) {
      await this.logoutAll(userId);
    }

    await this.recordAudit(userId, 'PASSWORD_CHANGE', 'SUCCESS', clientInfo, {});
    await emailService.sendPasswordChangedNotification(user.email);
  }

  /**
   * Forgot Password Path A: Recovery Unlock via 24-Word Recovery Phrase
   */
  async recoveryUnlock(
    data: {
      email: string;
      newAuthKey: string;
      newSalt: string;
      newKdfParams?: { m: number; t: number; p: number };
      newEncryptedMasterKey: string;
      newMasterKeyNonce: string;
    },
    clientInfo: ClientMetadata = {}
  ): Promise<{ message: string }> {
    const normalized = data.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newAuthHash = await hashAuthKey(data.newAuthKey);
    user.auth_key_hash = newAuthHash;
    user.salt = data.newSalt.toLowerCase();
    if (data.newKdfParams) user.kdf_params = data.newKdfParams;
    user.encrypted_master_key = data.newEncryptedMasterKey;
    user.master_key_nonce = data.newMasterKeyNonce;
    user.failed_login_attempts = 0;
    user.lockout_until = null;

    await this.userRepo.save(user);

    // Revoke all prior sessions on recovery unlock
    await this.logoutAll(user.id);
    await this.recordAudit(user.id, 'RECOVERY_UNLOCK', 'SUCCESS', clientInfo, {});

    return { message: 'Vault recovered and password updated successfully. Please login with your new password.' };
  }

  /**
   * Forgot Password Path B: Account Reset with Cryptographic Data Loss (ADR-014)
   */
  async accountReset(
    data: {
      email: string;
      confirmationText: string;
      newAuthKey: string;
      newSalt: string;
      newEncryptedMasterKey: string;
      newMasterKeyNonce: string;
      newEncryptedRecoveryMasterKey: string;
      newRecoveryNonce: string;
    },
    clientInfo: ClientMetadata = {}
  ): Promise<{ message: string }> {
    if (data.confirmationText !== 'DELETE MY ENCRYPTED VAULT') {
      throw new BadRequestError('Confirmation string mismatch. You must explicitly type "DELETE MY ENCRYPTED VAULT"');
    }

    const normalized = data.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (!user) throw new NotFoundError('User not found');

    // 1. Mark existing files and folders as orphaned with 30-day grace period
    await this.fileRepo.update({ user: { id: user.id } }, { is_trashed: true, trashed_at: new Date() });
    await this.folderRepo.update({ user: { id: user.id } }, { is_trashed: true, trashed_at: new Date() });

    // 2. Archive previous cryptographic bundle (ADR-014 30-day recovery grace safety)
    user.previous_key_bundle = {
      encrypted_master_key: user.encrypted_master_key,
      master_key_nonce: user.master_key_nonce,
      encrypted_recovery_master_key: user.encrypted_recovery_master_key,
      recovery_master_key_nonce: user.recovery_master_key_nonce,
      salt: user.salt,
      kdf_version: user.kdf_version,
      kdf_params: user.kdf_params,
      archived_at: new Date()
    };

    // 3. Set new user credentials with brand new Master Key and Recovery Phrase
    const newAuthHash = await hashAuthKey(data.newAuthKey);
    user.auth_key_hash = newAuthHash;
    user.salt = data.newSalt.toLowerCase();
    user.encrypted_master_key = data.newEncryptedMasterKey;
    user.master_key_nonce = data.newMasterKeyNonce;
    user.encrypted_recovery_master_key = data.newEncryptedRecoveryMasterKey;
    user.recovery_master_key_nonce = data.newRecoveryNonce;
    user.storage_used_bytes = '0';
    user.is_orphaned = true;
    user.orphaned_at = new Date();
    user.recovery_confirmed_at = null; // Must re-confirm new kit

    await this.userRepo.save(user);

    // 4. Revoke all existing sessions
    await this.logoutAll(user.id);
    await this.recordAudit(user.id, 'ACCOUNT_RESET', 'SUCCESS', clientInfo, { grace_period_days: 30 });
    await emailService.sendAccountResetWarning(user.email, 'reset-completed');

    return {
      message: 'Account reset successfully. Old encrypted files are orphaned and will be purged after 30 days.'
    };
  }

  /**
   * Request 256-bit single-use security action token for critical account actions
   */
  async requestAccountResetToken(email: string): Promise<string> {
    const normalized = email.trim().toLowerCase();
    let user: User | null = null;
    try {
      user = await this.userRepo.findOne({ where: { email: normalized } });
    } catch {
      // If DB is offline/uninitialized, fail-safe to generic response
      user = null;
    }
    if (!user) throw new NotFoundError('User not found');

    const token = generateRandomHex(32); // 256-bit token
    user.security_action_token = token;
    user.security_action_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.save(user);

    await emailService.sendAccountResetWarning(user.email, token);
    return token;
  }

  /**
   * Purge expired orphaned files after 30 days (ADR-014)
   */
  async purgeExpiredOrphans(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredUsers = await this.userRepo
      .createQueryBuilder('user')
      .where('user.is_orphaned = true')
      .andWhere('user.orphaned_at <= :cutoff', { cutoff: thirtyDaysAgo })
      .getMany();

    let purgedCount = 0;
    for (const u of expiredUsers) {
      await this.fileRepo.delete({ user: { id: u.id }, is_trashed: true });
      await this.folderRepo.delete({ user: { id: u.id }, is_trashed: true });
      u.is_orphaned = false;
      u.orphaned_at = null;
      u.previous_key_bundle = null;
      await this.userRepo.save(u);
      purgedCount++;
    }
    return purgedCount;
  }

  /**
   * Verify Email
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email_verification_token: token } });
    if (!user) throw new BadRequestError('Invalid or expired verification token');
    if (user.email_verification_expires_at && user.email_verification_expires_at < new Date()) {
      throw new BadRequestError('Verification token has expired');
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires_at = null;
    await this.userRepo.save(user);
  }

  /**
   * Resend Verification Email with Anti-User Enumeration
   */
  async resendVerification(
    email: string,
    clientInfo: ClientMetadata = {}
  ): Promise<{ message: string }> {
    const genericResponse = {
      message: 'If an unverified account exists with that email address, a new verification link has been dispatched.'
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return genericResponse;
    }

    const normalized = email.trim().toLowerCase();
    let user: User | null = null;
    try {
      user = await this.userRepo.findOne({ where: { email: normalized } });
    } catch {
      // If DB is offline/uninitialized, fail-safe to generic response
      user = null;
    }

    if (!user || user.is_email_verified) {
      // Timing balancing dummy derivation
      deriveDeterministicSalt(normalized);
      return genericResponse;
    }

    const verificationToken = generateRandomHex(32);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.email_verification_token = verificationToken;
    user.email_verification_expires_at = verificationExpires;
    await this.userRepo.save(user);

    await emailService.sendVerificationEmail(user.email, verificationToken);
    await this.recordAudit(user.id, 'AUTH_RESEND_VERIFICATION', 'SUCCESS', clientInfo);

    return genericResponse;
  }

  private async recordAudit(
    userId: string | null,
    action: string,
    status: string,
    clientInfo: ClientMetadata,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const log = this.auditRepo.create({
        user_id: userId,
        ip_address: clientInfo.ip || null,
        user_agent: clientInfo.userAgent || null,
        action,
        status,
        details: details || null
      });
      await this.auditRepo.save(log);
    } catch (err) {
      logger.error({ err }, 'Failed to record audit log');
    }
  }
}

export const authService = new AuthService();
