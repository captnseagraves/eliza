export interface JWTPayload {
  userId: string;
  phoneNumber: string;
}

export interface VerificationAttempt {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    phoneNumber: string;
  };
}
