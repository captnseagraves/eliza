import prisma from '../config/database';
import { generateToken } from '../middleware/auth';
import { twilioService } from './twilio.service';
import { logger } from '../config/logger';

// In-memory store for verification codes (replace with Redis in production)
const verificationCodes = new Map<string, any>();

export class AuthService {
  static async requestVerification(phoneNumber: string): Promise<void> {
    try {
      await twilioService.sendVerificationCode(phoneNumber);
    } catch (error) {
      logger.error(`Failed to send verification code to ${phoneNumber}`, error);
      throw new Error('Failed to send verification code');
    }
  }

  static async verifyCode(phoneNumber: string, code: string): Promise<{ token: string; userId: string }> {
    try {
      const isValid = await twilioService.checkVerificationCode(phoneNumber, code);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { phoneNumber },
        });
      }

      const token = generateToken(user.id);
      return { token, userId: user.id };
    } catch (error) {
      logger.error(`Verification failed for ${phoneNumber}`, error);
      throw error;
    }
  }
}
