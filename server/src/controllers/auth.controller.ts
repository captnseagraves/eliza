import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types/auth';

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

      const code = await AuthService.requestVerification(formattedPhone);

      // In development, send the code in the response
      const response = process.env.NODE_ENV === 'development' 
        ? { message: 'Verification code sent', code }
        : { message: 'Verification code sent' };

      res.json(response);
    } catch (error) {
      console.error('Error in requestVerification:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
      }

      const { token, userId } = await AuthService.verifyCode(phoneNumber, code);
      await UserService.updateLastLogin(userId);

      res.json({ token, userId });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to verify code' });
      }
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.token;
      if (token) {
        SessionService.blacklistToken(token);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await UserService.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await UserService.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
}
