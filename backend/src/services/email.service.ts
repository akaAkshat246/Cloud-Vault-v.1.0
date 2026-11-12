import { logger } from '../utils/logger.js';

export interface IEmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordChangedNotification(to: string): Promise<void>;
  sendAccountResetWarning(to: string, confirmationToken: string): Promise<void>;
  sendSecurityAlert(to: string, alertMessage: string): Promise<void>;
}

export class DevelopmentEmailService implements IEmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    logger.info({ to, token }, '[EMAIL DEV] Verification email dispatched');
  }

  async sendPasswordChangedNotification(to: string): Promise<void> {
    logger.info({ to }, '[EMAIL DEV] Password change notification dispatched');
  }

  async sendAccountResetWarning(to: string, confirmationToken: string): Promise<void> {
    logger.warn(
      { to, confirmationToken },
      '[EMAIL DEV] CRITICAL: Account reset warning with token dispatched'
    );
  }

  async sendSecurityAlert(to: string, alertMessage: string): Promise<void> {
    logger.warn({ to, alertMessage }, '[EMAIL DEV] SECURITY ALERT: Security alert email dispatched');
  }
}

export const emailService: IEmailService = new DevelopmentEmailService();

