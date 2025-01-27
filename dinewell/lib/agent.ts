import { Event, Invitation } from '@prisma/client';

interface EventContext {
    id: string;
    name: string;
    date: Date;
    time: string;
    location: string;
    description: string;
    latitude?: number | null;
    longitude?: number | null;
}

/**
 * Formats event details into a natural language message for the agent
 */
function formatEventContext(event: EventContext): string {
    const date = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return `
Event Details:
- Name: ${event.name}
- Date: ${date}
- Time: ${event.time}
- Location: ${event.location}
${event.description ? `- Description: ${event.description}` : ''}
${event.latitude && event.longitude ? `- Coordinates: ${event.latitude}, ${event.longitude}` : ''}
    `.trim();
}

/**
 * Initializes the agent chat room with event context
 */
export async function initializeAgentRoom(
    roomId: string,
    userId: string,
    event: EventContext
): Promise<void> {
    try {
        const contextMessage = formatEventContext(event);
        
        // Initialize the chat room with event context using the Next.js proxy
        const response = await fetch(`/agents/${roomId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                message: contextMessage,
                isSystem: true, // Mark as system message
                metadata: {
                    type: 'event_context',
                    eventId: event.id,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to initialize agent chat room');
        }
    } catch (error) {
        console.error('Error initializing agent chat room:', error);
        throw error;
    }
}
