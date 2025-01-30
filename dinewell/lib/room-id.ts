import { stringToUuid } from "../../packages/core/src/uuid";

/**
 * Generates a deterministic room ID for a host's event page
 */
export function generateHostRoomId(eventId: string, hostId: string): string {
    try {
        // Combine eventId and hostId in a consistent way
        const combinedString = `host:${eventId}:${hostId}`;
        return stringToUuid(combinedString);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Failed to generate host room ID: ${error.message}`
            );
        }
        throw error;
    }
}

/**
 * Generates a deterministic room ID for an invitation page
 */
export function generateInviteRoomId(
    eventId: string,
    invitationToken: string
): string {
    try {
        // Combine eventId and invitationToken in a consistent way
        const combinedString = `invite:${eventId}:${invitationToken}`;
        return stringToUuid(combinedString);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Failed to generate invite room ID: ${error.message}`
            );
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
