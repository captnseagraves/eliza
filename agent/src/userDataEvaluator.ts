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

interface UserData {
    rsvpStatus: string | undefined;
    name: string | undefined;
    location: string | undefined;
    occupation: string | undefined;
    isComplete: boolean;
    lastUpdated: number;
}

interface ExtractedField {
    value: string;
    override: boolean;
}

interface ExtractionResult {
    fields: {
        name?: ExtractedField;
        location?: ExtractedField;
        occupation?: ExtractedField;
        rsvpStatus?: ExtractedField;
    };
    context: {
        implicit: boolean;
        requires_confirmation: boolean;
        references_previous: boolean;
    };
}

const EXTRACTION_TEMPLATE = `
TASK: Extract user information from the conversation.

# CURRENT CONTEXT
Recent Messages: {{recentMessages}}

# INSTRUCTIONS
1. Extract any user information present in the conversation
2. For each field, provide:
   - value: The extracted information
   - override: Whether this should replace existing data

3. Consider these scenarios:
   - Direct statements ("I'm John", "I live in Seattle")
   - Implicit information ("Working as an engineer in Seattle")
   - Contextual references ("Yes, that's where I live")
   - Corrections ("Actually, I meant San Francisco")
   - RSVP Changes:
     * Positive: "yes", "I'll come", "I'll be there", "I want to go", "I'd love to"
     * Negative: "no", "I can't come", "I won't be there", "I don't want to go"
     * Always override previous RSVP status when a new one is detected

4. Pay special attention to:
   - Name: Full names only, no nicknames
   - Location: City/State/Country
   - Occupation: Current job or profession
   - RSVP: Set as 'attending' for positive responses, 'declined' for negative ones
   - When user expresses not wanting to attend, ALWAYS set rsvpStatus with override=true

# OUTPUT FORMAT
Return a JSON object with this structure:
{
  "fields": {
    "name": { "value": string, "override": boolean },
    "location": { "value": string, "override": boolean },
    "occupation": { "value": string, "override": boolean },
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

2. "I have no name"
   {
     "fields": {
       "name": { "value": "", "override": true }
     },
     "context": { "implicit": false, "requires_confirmation": false, "references_previous": false }
   }

# EXAMPLES
Input: "I'm John Smith, and I'd love to attend the dinner"
Output: {
  "fields": {
    "name": { "value": "John Smith", "override": true },
    "rsvpStatus": { "value": "attending", "override": true }
  },
  "context": {
    "implicit": false,
    "requires_confirmation": false,
    "references_previous": false
  }
}

Input: "Yes, that's where I live and work as a software engineer"
Output: {
  "fields": {
    "occupation": { "value": "software engineer", "override": true }
  },
  "context": {
    "implicit": false,
    "requires_confirmation": false,
    "references_previous": true
  }
}`;

async function validate(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        console.log("🔍 [UserDataEvaluator] Starting quick validation", {
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId
        });

        // 1. Skip if message is from agent
        if (message.userId === runtime.agentId) {
            console.log("⏭️ [UserDataEvaluator] Skipping agent message");
            return false;
        }

        // 2. Skip if message is a system message
        if (message.content.isSystem) {
            console.log("⏭️ [UserDataEvaluator] Skipping system message");
            return false;
        }

        // 3. Skip if message is too short (less than 2 words)
        const messageText = message.content.text || "";
        if (messageText.trim().split(/\s+/).length < 2) {
            console.log("⏭️ [UserDataEvaluator] Message too short");
            return false;
        }

        // 4. Quick check for personal pronouns and common markers
        const quickMarkers =
            /\b(i|my|me|yes|no|attending|attend|rsvp|dinner|live|work|name)\b/i;
        const rsvpMarkers =
            /\b(want|don't want|wont|won't|can't|cannot|decline|accept|yes|no)\b.*\b(go|attend|dinner|come)\b/i;

        if (!quickMarkers.test(messageText) && !rsvpMarkers.test(messageText)) {
            console.log(
                "⏭️ [UserDataEvaluator] No personal or RSVP markers found"
            );
            return false;
        }

        // 5. Check if we already have complete data
        const userDataManager = new MemoryManager({
            runtime,
            tableName: "user_data",
        });

        const existingData = await userDataManager.getMemories({
            roomId: message.roomId,
            count: 1,
            start: 0,
            end: Date.now(),
        });

        // Always process if it's an RSVP change
        if (rsvpMarkers.test(messageText)) {
            console.log("✅ [UserDataEvaluator] Processing RSVP change");
            return true;
        }

        // For non-RSVP updates, check if data is complete
        if (existingData.length > 0) {
            const userData = JSON.parse(
                existingData[0].content.text
            ) as UserData;
            console.log(
                "📝 [UserDataEvaluator] Processing update with existing data:",
                userData
            );
        }

        console.log("✅ [UserDataEvaluator] Message might contain user data");
        return true;
    } catch (error) {
        console.error("❌ [UserDataEvaluator] Validation error:", error);
        return false;
    }
}

async function handler(runtime: IAgentRuntime, message: Memory) {
    try {
        console.log("🔍 [UserDataEvaluator] Starting handler", {
            messageId: message.id,
            userId: message.userId,
            roomId: message.roomId
        });
        const state = await runtime.composeState(message);
        const { agentId, roomId } = state;

        // Log room context
        console.log("🏠 [UserDataEvaluator] Room context:", {
            stateRoomId: roomId,
            messageRoomId: message.roomId
        });

        // 1. Get existing user data
        const userDataManager = new MemoryManager({
            runtime,
            tableName: "user_data",
        });

        const existingMemories = await userDataManager.getMemories({
            roomId: message.roomId,
            count: 10,
            start: 0,
            end: Date.now(),
        });

        const existingData =
            existingMemories.length > 0
                ? (JSON.parse(existingMemories[0].content.text) as UserData)
                : null;

        // 2. Compose context for LLM
        console.log("📝 [UserDataEvaluator] Composing extraction context");
        const context = composeContext({
            state,
            template: EXTRACTION_TEMPLATE,
        });

        // 3. Extract information using LLM
        console.log("🤖 [UserDataEvaluator] Generating extraction result");
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
                    "⚠️ [UserDataEvaluator] Invalid extraction result format"
                );
                return false;
            }
        } catch (e) {
            console.log(
                "⚠️ [UserDataEvaluator] Failed to parse extraction result:",
                e
            );
            return false;
        }

        console.log(
            "📊 [UserDataEvaluator] Extraction result:",
            extractionResult
        );

        // 4. Process and store new data while preserving existing
        let userData: UserData = {
            rsvpStatus: undefined,
            name: undefined,
            location: undefined,
            occupation: undefined,
            isComplete: false,
            lastUpdated: Date.now(),
        };

        // Start with existing data if available
        if (existingData) {
            userData = { ...userData, ...existingData };
        }

        // Only update fields if they have a valid value
        (
            Object.entries(extractionResult.fields) as [
                keyof UserData,
                ExtractedField | undefined,
            ][]
        ).forEach(([key, field]) => {
            if (
                field &&
                (key === "name" ||
                    key === "location" ||
                    key === "occupation" ||
                    key === "rsvpStatus") &&
                field.value.trim() !== "" // Update if we have a non-empty value
            ) {
                console.log(
                    `📝 [UserDataEvaluator] ${userData[key] ? "Updating" : "Adding new"} ${key}:`,
                    field.value
                );
                userData[key] = field.value;
            } else {
                console.log(
                    `📝 [UserDataEvaluator] No new value for ${key}, keeping:`,
                    userData[key]
                );
            }
        });

        // Check completion status
        const requiredFields = ["name", "rsvpStatus", "location"];
        const missingRequired = requiredFields.filter((field) => {
            const value = userData[field as keyof UserData];
            return (
                !value ||
                (typeof value === "string" ? value.trim() === "" : false)
            );
        });
        userData.isComplete = missingRequired.length === 0;

        // Log missing fields if any
        if (missingRequired.length > 0) {
            console.log(
                "📝 [UserDataEvaluator] Missing required fields:",
                missingRequired
            );
        }

        console.log("📊 [UserDataEvaluator] Updated user data:", {
            userData,
            missingRequired,
            isComplete: userData.isComplete,
            roomId: message.roomId
        });

        // 5. Store in memory
        const existingId = existingMemories[0]?.id;
        const userMemory = await userDataManager.addEmbeddingToMemory({
            userId: message.userId,
            agentId,
            content: {
                text: JSON.stringify(userData),
                source: "userDataEvaluator",
            },
            roomId,
            createdAt: Date.now(),
            id: existingId,
        });

        console.log("💾 [UserDataEvaluator] Saving to memory", {
            memoryId: userMemory.id,
            roomId: message.roomId,
            isUpdate: !!existingId
        });

        if (existingId) {
            await userDataManager.removeMemory(existingId);
            await userDataManager.createMemory(userMemory, true);
        } else {
            await userDataManager.createMemory(userMemory, true);
        }

        return true;
    } catch (error) {
        console.error("❌ [UserDataEvaluator] Handler error:", error);
        return false;
    }
}

export const userDataEvaluator: Evaluator = {
    name: "USER_DATA",
    similes: ["GET_USER_DATA", "EXTRACT_USER_INFO", "UPDATE_USER_INFO"],
    validate,
    handler,
    description:
        "Extract and maintain user information including name, location, occupation, and RSVP status",
    examples: [
        {
            context: "User {{user1}} is providing their personal information",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Hi, I'm John Smith and I live in Seattle. I work as a software engineer.",
                        action: "USER_DATA",
                    },
                },
            ],
            outcome: "USER_DATA - Extract name, location, and occupation",
        },
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
        {
            context: "User {{user1}} is updating their information",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Actually, I moved to San Francisco last month",
                        action: "USER_DATA",
                    },
                },
            ],
            outcome: "USER_DATA - Update location information",
        },
        {
            context: "User {{user1}} casually mentions their name",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "my name is kevin and i love dinner",
                    },
                },
            ],
            outcome: "USER_DATA - Extract name from casual mention",
        },
        {
            context: "User {{user1}} mentions personal details in conversation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "i'm from chicago and i really enjoy cooking",
                    },
                },
            ],
            outcome: "USER_DATA - Extract location from casual mention",
        },
    ],
};
