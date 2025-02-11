import {
    IAgentRuntime,
    Memory,
    State,
    MemoryManager,
    elizaLogger,
    composeContext,
    generateText,
    ModelClass,
    Evaluator,
} from "@ai16z/eliza";

export interface RSVPData {
    rsvpStatus: string | undefined;
    lastUpdated: number;
}

interface ExtractionResult {
    fields: {
        rsvpStatus?: {
            value: string;
            override: boolean;
        };
    };
    context: {
        implicit: boolean;
        requires_confirmation: boolean;
        references_previous: boolean;
    };
}

interface EventContext {
    type: string;
    source: string;
    eventId: string;
    invitationToken: string;
    phoneNumber: string;
}

const EXTRACTION_TEMPLATE = `
TASK: Extract RSVP intention from the conversation.

# CURRENT CONTEXT
Recent Messages: {{recentMessages}}

# INSTRUCTIONS
1. Extract any RSVP intention present in the conversation
2. For RSVP status, provide:
   - value: The extracted status
   - override: Whether this should replace existing status

3. Consider these RSVP scenarios:
   - Positive: "yes", "I'll come", "I'll be there", "I want to go", "I'd love to"
   - Negative: "no", "I can't come", "I won't be there", "I don't want to go"
   - Always override previous RSVP status when a new one is detected

4. RSVP Status:
   - Set as 'attending' for positive responses
   - Set as 'declined' for negative responses
   - When user expresses not wanting to attend, ALWAYS set rsvpStatus with override=true

# OUTPUT FORMAT
Return a JSON object with this structure:
{
  "fields": {
    "rsvpStatus": { "value": string, "override": boolean }
  },
  "context": {
    "implicit": boolean,
    "requires_confirmation": boolean,
    "references_previous": boolean
  }
}

# EXAMPLES
1. "I don't want to go to dinner"
   {
     "fields": {
       "rsvpStatus": { "value": "declined", "override": true }
     },
     "context": { "implicit": false, "requires_confirmation": false, "references_previous": false }
   }

2. "Yes, I'll be there!"
   {
     "fields": {
       "rsvpStatus": { "value": "attending", "override": true }
     },
     "context": { "implicit": false, "requires_confirmation": false, "references_previous": false }
   }`;

async function validate(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        console.log("🔍 [rsvpEvaluator] Starting quick validation", {
            message,
            runtime,
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId,
        });

        // 1. Skip if message is from agent
        if (message.userId === runtime.agentId) {
            console.log("⏭️ [rsvpEvaluator] Skipping agent message");
            return false;
        }

        console.log("origin", message.content.origin);

        // 2. Skip if message is from the landing page
        if (message.content.origin === "landing") {
            console.log("⏭️ [rsvpEvaluator] Skipping landing message");
            return false;
        }

        // 3. Skip if message is too short (less than 2 words)
        const messageText = message.content.text || "";
        if (messageText.trim().split(/\s+/).length < 2) {
            console.log("⏭️ [rsvpEvaluator] Message too short");
            return false;
        }

        // 4. Check for RSVP markers
        const rsvpMarkers =
            /\b(would|love|confirm|want|don't want|wont|won't|can't|cannot|decline|accept|yes|no|go|dinner|attend|come|rsvp|officially)\b/i;

        if (!rsvpMarkers.test(messageText)) {
            console.log("⏭️ [rsvpEvaluator] No RSVP markers found");
            return false;
        }

        console.log("✅ [rsvpEvaluator] Processing RSVP change");
        return true;
    } catch (error) {
        elizaLogger.error("Error in rsvpEvaluator validate:", error);
        return false;
    }
}

async function updateRSVPStatus(
    roomId: string,
    status: string
): Promise<boolean> {
    try {
        console.log("🔄 [rsvpEvaluator] Updating RSVP status:", {
            roomId,
            status,
        });

        // Get the base URL from environment variables, defaulting to localhost if not set
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const response = await fetch(
            `${baseUrl}/api/invite/room/${roomId}/respond`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ [rsvpEvaluator] RSVP update successful:", result);
        return true;
    } catch (error) {
        console.error("❌ [rsvpEvaluator] Error updating RSVP status:", error);
        return false;
    }
}

async function handler(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        console.log("🔍 [rsvpEvaluator] Starting handler", {
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId,
        });

        // Skip if message is from the landing page
        if (message.content.origin === "landing") {
            console.log("⏭️ [rsvpEvaluator] Skipping landing message");
            return false;
        }

        const state = await runtime.composeState(message);
        console.log("👤 [rsvpEvaluator] Composing state", state);

        // Compose context for LLM
        const context = composeContext({
            state,
            template: EXTRACTION_TEMPLATE,
        });
        console.log("📝 [rsvpEvaluator] Composing extraction context", context);

        // Extract information using LLM
        const result = await generateText({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });
        console.log("🤖 [rsvpEvaluator] Generating extraction result", result);

        let extractionResult: ExtractionResult;
        try {
            extractionResult = JSON.parse(result) as ExtractionResult;
            if (!extractionResult || !extractionResult.fields) {
                console.log(
                    "⚠️ [rsvpEvaluator] Invalid extraction result format"
                );
                return false;
            }
        } catch (e) {
            console.log(
                "⚠️ [rsvpEvaluator] Failed to parse extraction result:",
                e
            );
            return false;
        }

        console.log("📊 [rsvpEvaluator] Extraction result:", extractionResult);

        // Process RSVP status if present
        const status = extractionResult.fields.rsvpStatus?.value;
        if (status) {
            console.log("🎫 [rsvpEvaluator] Processing RSVP status:", {
                roomId: message.roomId,
                status,
            });

            const success = await updateRSVPStatus(
                message.roomId,
                extractionResult.fields.rsvpStatus.value
            );

            if (success) {
                console.log(
                    "✅ [rsvpEvaluator] RSVP status updated successfully"
                );
            } else {
                console.warn("⚠️ [rsvpEvaluator] Failed to update RSVP status");
                return false;
            }

            // Save to memory
            const userDataManager = new MemoryManager({
                runtime,
                tableName: "user_data",
            });
            console.log(
                "👤 [rsvpEvaluator] Composing user data manager",
                userDataManager
            );

            await userDataManager.createMemory({
                roomId: message.roomId,
                userId: message.userId,
                agentId: message.agentId,
                content: {
                    text: JSON.stringify({
                        rsvpStatus: status,
                        lastUpdated: Date.now(),
                    }),
                },
            });

            return true;
        }

        return false;
    } catch (error) {
        elizaLogger.error("Error in rsvpEvaluator handler:", error);
        return false;
    }
}

export const rsvpEvaluator: Evaluator = {
    name: "RSVP_STATUS",
    similes: ["GET_RSVP_STATUS", "UPDATE_RSVP_STATUS"],
    validate,
    handler,
    description: "Extract and maintain users RSVP status",
    examples: [
        {
            context: "User {{user1}} is responding to a dinner invitation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Yes, I'd love to attend the dinner!",
                        action: "USER_DATA",
                    },
                },
            ],
            outcome: "USER_DATA - Extract RSVP status",
        },
    ],
};
