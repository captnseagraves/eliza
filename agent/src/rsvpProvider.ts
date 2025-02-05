import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@ai16z/eliza";

import { RSVPData } from "./rsvpEvaluator";
import { MemoryManager } from "@ai16z/eliza";

// Initialize empty RSVP data
const emptyRSVPData: RSVPData = {
    rsvpStatus: undefined,
    lastUpdated: undefined,
};

// RSVP status guidance
const RSVP_GUIDANCE = {
    description: "RSVP status for dinner events",
    valid: "attending, declined",
    invalid: "maybe, unsure, or ambiguous responses",
    instructions:
        "Set as 'attending' for positive responses, 'declined' for negative ones",
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // ms

async function getLatestStatus(
    roomId: string,
    baseUrl: string,
    retries = 0
): Promise<string> {
    try {
        const response = await fetch(
            `${baseUrl}/api/invite/room/${roomId}/status`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            console.log("⚠️ [rsvpProvider] API request failed:", {
                status: response.status,
                statusText: response.statusText,
            });
            return "PENDING";
        }

        const data = await response.json();
        console.log(" ************ [rsvpProvider] Fetched RSVP status:", data);

        // If status is PENDING and we haven't exceeded retries, wait and try again
        if (data.status === "PENDING" && retries < MAX_RETRIES) {
            console.log(
                `🔄 [rsvpProvider] Status PENDING, retry ${retries + 1} of ${MAX_RETRIES}`
            );
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return getLatestStatus(roomId, baseUrl, retries + 1);
        }

        return data.status;
    } catch (error) {
        elizaLogger.error("Error fetching RSVP status:", error);
        return "PENDING";
    }
}

// Provider Implementation
export const rsvpProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> => {
        try {
            // Initialize with empty data
            let cachedData: RSVPData = { ...emptyRSVPData };

            // Get existing data using MemoryManager
            const rsvpDataManager = new MemoryManager({
                runtime,
                tableName: "user_data",
            });

            const existingData = await rsvpDataManager.getMemories({
                roomId: message.roomId,
                count: 10,
                start: 0,
                end: Date.now(),
            });

            console.log(
                " ****** [rsvpProvider] Existing data: **********",
                existingData
            );

            if (existingData && existingData.length > 0) {
                cachedData = JSON.parse(
                    existingData[0].content.text
                ) as RSVPData;
                console.log(
                    " ****** [rsvpProvider] Found existing data: **********",
                    cachedData
                );
            }

            // Get the base URL from environment variables, defaulting to localhost if not set
            const baseUrl =
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

            // Get latest status with retries
            const status = await getLatestStatus(message.roomId, baseUrl);
            cachedData.rsvpStatus = status;

            let response =
                "Check the current message for an RSVP response. If one is present then acknowledge it and does not ask for it again. otherwise following prompt below.\n\n";

            // Current RSVP Status
            if (cachedData.rsvpStatus === "ATTENDING") {
                response += `Current Status: ${cachedData.rsvpStatus}\n\n`;
            } else if (cachedData.rsvpStatus === "DECLINED") {
                response += `Current Status: ${cachedData.rsvpStatus}\n\n`;
            } else {
                response +=
                    `CURRENT TASK FOR ${runtime.character.name}:\n` +
                    `${runtime.character.name} should try to prioritize getting the user's rsvp for the dinner by aggressively asking them for it\n`;
                +"RSVP Guidelines:\n" +
                    `- Description: ${RSVP_GUIDANCE.description}\n` +
                    `- Valid Responses: ${RSVP_GUIDANCE.valid}\n` +
                    `- Do Not Accept: ${RSVP_GUIDANCE.invalid}\n` +
                    `- Instructions: ${RSVP_GUIDANCE.instructions}\n`;
            }

            console.log("******** PROVIDER RESPONSE **************", response);

            return response;
        } catch (error) {
            elizaLogger.error("Error in rsvpProvider:", error);
            return "Error accessing RSVP information. Please try again.";
        }
    },
};
