import { createHash } from 'crypto';
import { v5 as uuidv5 } from 'uuid';

// UUID namespace for our application (generate once and keep constant)
const PHONE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Normalizes a phone number to a consistent format
 * Strips all non-numeric characters and ensures +1 prefix
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure number has 10 digits (US format) and add +1
    if (cleaned.length === 10) {
        return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned}`;
    }
    
    throw new Error('Invalid phone number format');
}

/**
 * Generates a deterministic UUID v5 from a phone number
 * The same phone number will always generate the same UUID
 */
export function generateUserIdFromPhone(phoneNumber: string): string {
    try {
        // Normalize the phone number first
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Create a hash of the phone number
        const phoneHash = createHash('sha256')
            .update(normalizedPhone)
            .digest('hex');
            
        // Generate a UUID v5 using the phone hash and our namespace
        const userId = uuidv5(phoneHash, PHONE_NAMESPACE);
        
        return userId;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate user ID: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Validates if a string is a valid phone number
 * Supports US phone numbers with or without country code
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    try {
        normalizePhoneNumber(phoneNumber);
        return true;
    } catch {
        return false;
    }
}
