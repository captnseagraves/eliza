import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types/auth';
import { logger } from '../config/logger';

export class AuthController {
  static async requestVerification(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Remove any non-numeric characters and ensure it starts with +
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      await AuthService.requestVerification(formattedPhone);
      res.json({ message: 'Verification code sent' });
    } catch (error) {
      logger.error('Error in requestVerification:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
      }

      // Remove any non-numeric characters from phone
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      const { token, userId } = await AuthService.verifyCode(formattedPhone, code);
      const user = await UserService.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await UserService.updateLastLogin(userId);
      res.json({ token, user });
    } catch (error) {
      logger.error('Error in verifyCode:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Verification failed' });
      }
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.token;
      if (token) {
        await SessionService.invalidateSession(token);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Error in logout:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}
