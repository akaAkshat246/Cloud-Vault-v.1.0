import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { enforceCsrfProtection } from '../middleware/csrf.js';
import { BadRequestError } from '../utils/errors.js';
import { AppDataSource } from '../database/data-source.js';
import { User } from '../database/entities/User.js';

export const authRouter = Router();

// Helper to extract client metadata (IP, user agent)
function getClientMeta(req: Request) {
  return {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    deviceName: (req.body?.deviceName as string) || (req.headers['x-device-name'] as string) || 'Web Browser'
  };
}

// 1. Pre-Login (Anti-User Enumeration)
authRouter.post('/prelogin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new BadRequestError('Email is required');
    const result = await authService.prelogin(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// 2. User Registration
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body, getClientMeta(req));
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// 3. User Login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, authKey } = req.body;
    if (!email || !authKey) throw new BadRequestError('Email and authKey are required');

    const result = await authService.login(email, authKey, getClientMeta(req));

    // For Web clients: set refresh token in httpOnly, Secure, SameSite=Strict cookie
    res.cookie('cv_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// 4. Refresh Token (with CSRF protection and family rotation)
authRouter.post('/refresh', enforceCsrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.cv_refresh_token || req.body?.refreshToken;
    if (!token) throw new BadRequestError('Refresh token is required');

    const result = await authService.refresh(token, getClientMeta(req));

    // Update cookie
    res.cookie('cv_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// 5. Logout
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.cv_refresh_token || req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('cv_refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// 6. Logout All Sessions
authRouter.post('/logout-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logoutAll(req.user!.id);
    res.clearCookie('cv_refresh_token');
    res.status(200).json({ message: 'All active sessions revoked' });
  } catch (error) {
    next(error);
  }
});

// 7. Get Active Sessions
authRouter.get('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawHeader = req.headers['x-refresh-token'];
    const currentToken = req.cookies?.cv_refresh_token || (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader);
    const sessions = await authService.getSessions(req.user!.id, currentToken);
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
});

// 8. Revoke Specific Session
authRouter.delete('/sessions/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await authService.revokeSession(req.user!.id, sessionId);
    res.status(200).json({ message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// 9. Confirm Recovery Kit
authRouter.post('/recovery/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const confirmedAt = await authService.confirmRecoveryChallenge(req.user!.id);
    res.status(200).json({ message: 'Recovery kit confirmed successfully', recovery_confirmed_at: confirmedAt });
  } catch (error) {
    next(error);
  }
});

// 10. Change Password (Re-wrap Master Key without File Re-Encryption)
authRouter.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.changePassword(req.user!.id, req.body, getClientMeta(req));
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// 11. Forgot Password Path A: Recovery Unlock
authRouter.post('/recovery/unlock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.recoveryUnlock(req.body, getClientMeta(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// 12. Forgot Password Path B: Account Reset (ADR-014)
authRouter.post('/account-reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.accountReset(req.body, getClientMeta(req));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// 13. Verify Email
authRouter.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) throw new BadRequestError('Verification token is required');
    await authService.verifyEmail(token);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// 14. Get Authenticated User Profile (GET /me)
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: req.user!.id },
      relations: ['plan']
    });
    if (!user) throw new BadRequestError('User not found');

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        storage_used_bytes: user.storage_used_bytes,
        storage_quota_bytes: user.storage_quota_bytes,
        recovery_confirmed_at: user.recovery_confirmed_at,
        is_email_verified: user.is_email_verified,
        plan: user.plan
          ? {
              id: user.plan.id,
              name: user.plan.name,
              quota_bytes: user.plan.quota_bytes
            }
          : null,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});
