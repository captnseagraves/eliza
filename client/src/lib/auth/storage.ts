import { env } from "@/config/env";

const TOKEN_KEY = `${env.VITE_AUTH_STORAGE_KEY}_token`;
const USER_KEY = `${env.VITE_AUTH_STORAGE_KEY}_user`;

export interface StoredUser {
  id: string;
  phoneNumber: string;
}

class AuthStorage {
  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  getToken(): string | null {
    return this.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    this.setItem(TOKEN_KEY, token);
    // Set token expiration
    const expiresAt = new Date().getTime() + env.VITE_SESSION_DURATION * 1000;
    this.setItem(`${TOKEN_KEY}_expires`, expiresAt.toString());
  }

  removeToken(): void {
    this.removeItem(TOKEN_KEY);
    this.removeItem(`${TOKEN_KEY}_expires`);
  }

  getUser(): StoredUser | null {
    const user = this.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setUser(user: StoredUser): void {
    this.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    this.removeItem(USER_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }

  isTokenExpired(): boolean {
    const expiresAt = this.getItem(`${TOKEN_KEY}_expires`);
    if (!expiresAt) return true;
    return new Date().getTime() > parseInt(expiresAt, 10);
  }
}

export const storage = new AuthStorage();
