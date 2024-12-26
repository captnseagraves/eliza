import { authConfig } from '../config/auth';

// In-memory store for blacklisted tokens (replace with Redis in production)
const blacklistedTokens = new Set<string>();

export class SessionService {
  static isTokenBlacklisted(token: string): boolean {
    return blacklistedTokens.has(token);
  }

  static blacklistToken(token: string): void {
    blacklistedTokens.add(token);
    
    // Clean up old tokens after JWT expiry time
    setTimeout(() => {
      blacklistedTokens.delete(token);
    }, parseInt(authConfig.jwt.expiresIn) * 1000);
  }

  static clearAllSessions(): void {
    blacklistedTokens.clear();
  }
}
