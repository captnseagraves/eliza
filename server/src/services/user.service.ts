import prisma from '../config/database';
import { User } from '@prisma/client';

export class UserService {
  static async getUserProfile(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdEvents: true,
        userEvents: {
          include: {
            event: true,
          },
        },
      },
    });
  }

  static async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    // Ensure we can't update critical fields
    const { id, phoneNumber, verified, createdAt, ...updateData } = data;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }
}
