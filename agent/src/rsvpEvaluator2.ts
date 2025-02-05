import {
    IAgentRuntime,
    Memory,
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

// RSVP guidance for generating responses
const RSVP_GUIDANCE = {
    description: "RSVP status for dinner events",
    valid: "attending, declined",
    invalid: "maybe, unsure, or ambiguous responses",
    instructions:
        "Set as 'attending' for positive responses, 'declined' for negative ones",
};

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
}`;

async function generateRSVPResponse(
    status: string,
    runtime: IAgentRuntime
): Promise<string> {
    if (status === "ATTENDING") {
        return "I'm delighted to confirm your attendance! I've marked you as attending for the dinner. Looking forward to a wonderful gathering!";
    } else {
        return (
            `I notice you haven't confirmed your attendance yet. As ${runtime.character.name}, I'd love to know if you'll join us!\n\n` +
            `Please let me know with a clear response:\n` +
            `✓ For attending: "yes", "I'll come", "I'll be there"\n` +
            `✗ For declining: "no", "I can't come", "I won't be there"\n\n` +
            `Your response helps us plan the perfect dinner!`
        );
    }
}

async function validate(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        console.log("🔍 [rsvpEvaluator2] Starting quick validation", {
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId,
        });

        // 1. Skip if message is from agent
        if (message.userId === runtime.agentId) {
            console.log("⏭️ [rsvpEvaluator2] Skipping agent message");
            return false;
        }

        // 2. Skip if message is a system message
        if (message.content.isSystem) {
            console.log("⏭️ [rsvpEvaluator2] Skipping system message");
            return false;
        }

        // 3. Skip if message is too short (less than 2 words)
        const messageText = message.content.text || "";
        if (messageText.trim().split(/\s+/).length < 2) {
            console.log("⏭️ [rsvpEvaluator2] Message too short");
            return false;
        }

        // 4. Check for RSVP markers
        const rsvpMarkers =
            /\b(would|love|confirm|want|don't want|wont|won't|can't|cannot|decline|accept|yes|no|go|dinner|attend|come|rsvp|officially)\b/i;

        if (!rsvpMarkers.test(messageText)) {
            console.log("⏭️ [rsvpEvaluator2] No RSVP markers found");
            return false;
        }

        console.log("✅ [rsvpEvaluator2] Processing RSVP change");
        return true;
    } catch (error) {
        elizaLogger.error("Error in rsvpEvaluator2 validate:", error);
        return false;
    }
}

async function updateRSVPStatus(
    roomId: string,
    status: string
): Promise<boolean> {
    try {
        console.log("🔄 [rsvpEvaluator2] Updating RSVP status:", {
            roomId,
            status,
        });

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
        console.log("✅ [rsvpEvaluator2] RSVP update successful:", result);
        return true;
    } catch (error) {
        console.error("❌ [rsvpEvaluator2] Error updating RSVP status:", error);
        return false;
    }
}

async function handler(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        console.log("🔍 [rsvpEvaluator2] Starting handler", {
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId,
        });

        const state = await runtime.composeState(message);
        const { roomId } = state;

        // Compose context for LLM
        console.log("📝 [rsvpEvaluator2] Composing extraction context");
        const context = composeContext({
            state,
            template: EXTRACTION_TEMPLATE,
        });

        // Extract information using LLM
        console.log("🤖 [rsvpEvaluator2] Generating extraction result");
        const result = await generateText({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        let extractionResult: ExtractionResult;
        try {
            extractionResult = JSON.parse(result) as ExtractionResult;
            if (!extractionResult || !extractionResult.fields) {
                console.log(
                    "⚠️ [rsvpEvaluator2] Invalid extraction result format"
                );
                return false;
            }
        } catch (e) {
            console.log(
                "⚠️ [rsvpEvaluator2] Failed to parse extraction result:",
                e
            );
            return false;
        }

        console.log("📊 [rsvpEvaluator2] Extraction result:", extractionResult);

        // Process RSVP status if present
        const status = extractionResult.fields.rsvpStatus?.value;
        if (status) {
            console.log("🎫 [rsvpEvaluator2] Processing RSVP status:", {
                roomId: message.roomId,
                status,
            });

            const success = await updateRSVPStatus(
                message.roomId,
                extractionResult.fields.rsvpStatus.value
            );

            if (success) {
                console.log(
                    "✅ [rsvpEvaluator2] RSVP status updated successfully"
                );

                // Generate response based on status
                const responseText = await generateRSVPResponse(
                    status.toUpperCase(),
                    runtime
                );

                // Save both status and response to memory
                const userDataManager = new MemoryManager({
                    runtime,
                    tableName: "user_data",
                });

                await userDataManager.createMemory({
                    roomId: message.roomId,
                    userId: message.userId,
                    agentId: message.agentId,
                    content: {
                        text: JSON.stringify({
                            rsvpStatus: status,
                            lastUpdated: Date.now(),
                            responseText: responseText,
                        }),
                    },
                });

                return true;
            } else {
                console.warn(
                    "⚠️ [rsvpEvaluator2] Failed to update RSVP status"
                );
                return false;
            }
        }

        return false;
    } catch (error) {
        elizaLogger.error("Error in rsvpEvaluator2 handler:", error);
        return false;
    }
}

export const rsvpEvaluator2: Evaluator = {
    name: "rsvp_evaluator2",
    similes: ["GET_RSVP_STATUS", "UPDATE_RSVP_STATUS"],
    validate,
    handler,
    description:
        "Extract and maintain users RSVP status with response generation",
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
            outcome: "USER_DATA - Extract RSVP status and generate response",
        },
    ],
};
