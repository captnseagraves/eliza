import { Event, Invitation } from "@prisma/client";

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

interface Agent {
    id: string;
    name: string;
}

interface AgentsResponse {
    agents: Agent[];
}

/**
 * Formats event details into a natural language message for the agent
 */
function formatEventContext(event: EventContext): string {
    const date = new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return `
Event Details:
- Name: ${event.name}
- Date: ${date}
- Time: ${event.time}
- Location: ${event.location}
${event.description ? `- Description: ${event.description}` : ""}
${event.latitude && event.longitude ? `- Coordinates: ${event.latitude}, ${event.longitude}` : ""}
    `.trim();
}

/**
 * Initializes the agent chat room with event context
 */
export async function initializeAgentRoom(
    roomId: string,
    userId: string,
    event: EventContext & {
        invitationToken?: string;
        phoneNumber?: string;
        source?: string;
        type?: string;
    }
): Promise<void> {
    try {
        const contextMessage = formatEventContext(event);

        // Initialize the chat room with event context using the Next.js proxy
        const response = await fetch(`/agents/${roomId}/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                message: contextMessage,
                isSystem: true, // Mark as system message
                metadata: {
                    type: event.type || "event_context",
                    source: event.source || "direct",
                    eventId: event.id,
                    invitationToken: event.invitationToken,
                    phoneNumber: event.phoneNumber
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to initialize agent chat room");
        }
    } catch (error) {
        console.error("Error initializing agent chat room:", error);
        throw error;
    }
}

export async function getFirstAgentId(): Promise<string> {
    const res = await fetch("http://localhost:8080/agents");
    if (!res.ok) {
        throw new Error("Failed to fetch agents");
    }
    const data = (await res.json()) as AgentsResponse;
    if (!data.agents?.length) {
        throw new Error("No agents available");
    }
    return data.agents[0].id;
}
