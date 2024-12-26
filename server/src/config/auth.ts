import jwt from 'jsonwebtoken';
import { env } from './env';

console.log('Auth config loading, JWT_SECRET:', env.JWT_SECRET ? 'is set' : 'is not set');

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set in server .env file');
}

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  verification: {
    codeExpiry: 10 * 60 * 1000, // 10 minutes in milliseconds
    codeLength: 6,
  },
};
