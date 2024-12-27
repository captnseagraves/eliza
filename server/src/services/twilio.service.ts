import twilio from 'twilio';
import { logger } from '../config/logger';

class TwilioService {
  private client: twilio.Twilio;
  private verifyServiceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error('Missing Twilio configuration');
    }

    this.client = twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
  }

  async sendVerificationCode(to: string): Promise<string> {
    try {
      // Format phone number to E.164 format
      const formattedPhone = to.startsWith('+') ? to : `+1${to}`;

      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: formattedPhone,
          channel: 'sms'
        });

      logger.info(`Verification initiated: ${verification.sid}`);
      return verification.sid;
    } catch (error) {
      logger.error('Failed to send verification:', error);
      throw error;
    }
  }

  async checkVerificationCode(to: string, code: string): Promise<boolean> {
    try {
      // Format phone number to E.164 format
      const formattedPhone = to.startsWith('+') ? to : `+1${to}`;

      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: formattedPhone,
          code: code
        });

      return verificationCheck.status === 'approved';
    } catch (error) {
      logger.error('Failed to check verification code:', error);
      throw error;
    }
  }
}

export const twilioService = new TwilioService();
