import { createHash } from 'crypto';
import { v5 as uuidv5 } from 'uuid';

// UUID namespace for our application (generate once and keep constant)
const ROOM_NAMESPACE = '7ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generates a deterministic room ID for a host's event page
 */
export function generateHostRoomId(eventId: string, hostId: string): string {
    try {
        // Combine eventId and hostId in a consistent way
        const combinedString = `host:${eventId}:${hostId}`;
        
        // Create a hash of the combined string
        const combinedHash = createHash('sha256')
            .update(combinedString)
            .digest('hex');
            
        // Generate a UUID v5 using the hash and our namespace
        const roomId = uuidv5(combinedHash, ROOM_NAMESPACE);
        
        return roomId;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate host room ID: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Generates a deterministic room ID for an invitation page
 */
export function generateInviteRoomId(eventId: string, invitationToken: string): string {
    try {
        // Combine eventId and invitationToken in a consistent way
        const combinedString = `invite:${eventId}:${invitationToken}`;
        
        // Create a hash of the combined string
        const combinedHash = createHash('sha256')
            .update(combinedString)
            .digest('hex');
            
        // Generate a UUID v5 using the hash and our namespace
        const roomId = uuidv5(combinedHash, ROOM_NAMESPACE);
        
        return roomId;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate invite room ID: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Validates if the provided room ID belongs to the given event and invitation
 */
export function validateInviteRoomAccess(
    roomId: string,
    eventId: string,
    invitationToken: string
): boolean {
    try {
        const expectedRoomId = generateInviteRoomId(eventId, invitationToken);
        return roomId === expectedRoomId;
    } catch {
        return false;
    }
}

/**
 * Validates if the provided room ID belongs to the given event and host
 */
export function validateHostRoomAccess(
    roomId: string,
    eventId: string,
    hostId: string
): boolean {
    try {
        const expectedRoomId = generateHostRoomId(eventId, hostId);
        return roomId === expectedRoomId;
    } catch {
        return false;
    }
}
