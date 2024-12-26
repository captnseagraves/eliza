import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { generateToken } from '../middleware/auth';
import { VerificationAttempt } from '../types/auth';

// In-memory store for verification codes (replace with Redis in production)
const verificationCodes = new Map<string, VerificationAttempt>();

export class AuthService {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async requestVerification(phoneNumber: string): Promise<string> {
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + authConfig.verification.codeExpiry);

    verificationCodes.set(phoneNumber, {
      phoneNumber,
      code,
      expiresAt,
    });

    // TODO: Integrate with actual SMS service
    console.log(`Verification code for ${phoneNumber}: ${code}`);
    
    return code;
  }

  static async verifyCode(phoneNumber: string, code: string): Promise<{ token: string; userId: string }> {
    const verification = verificationCodes.get(phoneNumber);

    if (!verification) {
      throw new Error('No verification code found');
    }

    if (verification.expiresAt < new Date()) {
      verificationCodes.delete(phoneNumber);
      throw new Error('Verification code expired');
    }

    if (verification.code !== code) {
      throw new Error('Invalid verification code');
    }

    // Clear the verification code
    verificationCodes.delete(phoneNumber);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          verified: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          lastLogin: new Date(),
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
    });

    return { token, userId: user.id };
  }
}
