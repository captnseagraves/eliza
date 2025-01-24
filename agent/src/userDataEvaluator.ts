import {
    Evaluator,
    IAgentRuntime,
    Memory,
    MemoryManager,
    State,
    Content,
    elizaLogger,
    UUID,
    composeContext,
    generateObjectArray,
    ModelClass,
} from "@ai16z/eliza";

interface UserData {
    rsvpStatus: string | undefined;
    name: string | undefined;
    location: string | undefined;
    occupation: string | undefined;
    isComplete: boolean;
    lastUpdated: number;
}

interface ExtractedData {
    rsvpStatus?: string;
    name?: string;
    location?: string;
    occupation?: string;
}

const EXTRACTION_TEMPLATE = `
TASK: Extract user information from the conversation in JSON format.

# FIELD GUIDANCE
name: {
        description: "User's full name",
        valid: "John Smith, Maria Garcia",
        invalid: "nicknames, usernames, other people's names, or partial names",
        instructions: "Extract only when user directly states their own name"
    },
    location: {
        description: "Current place of residence",
        valid: "Seattle WA, London UK, Toronto",
        invalid: "places visited, previous homes, or future plans",
        instructions: "Extract only current residence location, not temporary or planned locations"
    },
    occupation: {
        description: "Current profession or job",
        valid: "software engineer, teacher, nurse, business owner",
        invalid: "past jobs, aspirational roles, or hobbies",
        instructions: "Extract only current primary occupation or profession"
    },
    rsvpStatus: {
        description: "Dinner attendance status",
        valid: "attending, not attending",
        invalid: "maybe, thinking about it, will try",
        instructions: "Extract only clear attendance confirmations or declinations"
    }

# CONVERSATION CONTEXT
{{recentMessages}}

Response should be a JSON object with the following format:
{
    "rsvpStatus": string | null,  // User's RSVP status for dinner (attending/not attending)
    "name": string | null,        // User's full name
    "location": string | null,    // User's current location
    "occupation": string | null   // User's current occupation
}

Only extract information that is explicitly stated in the conversation.
If a field's value cannot be determined with high confidence, return null.
`;

const validateField = (
    field: keyof ExtractedData,
    value: string | undefined
): boolean => {
    if (!value) return false;

    switch (field) {
        case "rsvpStatus":
            return ["attending", "not attending"].includes(value.toLowerCase());
        case "name":
            return /^[A-Za-z\s\-']{2,50}$/.test(value);
        case "location":
            return /^[A-Za-z\s\-',]{2,100}$/.test(value);
        case "occupation":
            return /^[A-Za-z\s\-&]{2,100}$/.test(value);
        default:
            return false;
    }
};

async function handler(
    runtime: IAgentRuntime,
    message: Memory
): Promise<boolean> {
    try {
        const state = await runtime.composeState(message);
        const { agentId, roomId } = state;

        // Skip if message is from the agent
        if (message.userId === agentId) {
            return false;
        }

        const context = composeContext({
            state,
            template: EXTRACTION_TEMPLATE,
        });

        const results = await generateObjectArray({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!results || !Array.isArray(results) || results.length === 0) {
            elizaLogger.warn("No valid user data extracted");
            return false;
        }

        const extractedData = results[0] as ExtractedData;

        // Validate each field
        Object.entries(extractedData).forEach(([key, value]) => {
            const field = key as keyof ExtractedData;
            if (!validateField(field, value)) {
                elizaLogger.warn(`Invalid ${field} value: ${value}`);
                delete extractedData[field];
            }
        });

        if (Object.keys(extractedData).length === 0) {
            return false;
        }

        const userDataManager = new MemoryManager({
            runtime,
            tableName: "user_data",
        });

        // Get existing user data
        const existingMemories =
            await userDataManager.searchMemoriesByEmbedding(
                message.embedding || [],
                {
                    roomId: message.roomId,
                    count: 1,
                    match_threshold: 0.8,
                }
            );

        let userData: UserData = {
            rsvpStatus: undefined,
            name: undefined,
            location: undefined,
            occupation: undefined,
            isComplete: false,
            lastUpdated: Date.now(),
        };

        if (existingMemories.length > 0) {
            userData = {
                ...userData,
                ...JSON.parse(existingMemories[0].content.text),
            };
        }

        // Update user data with extracted data
        userData = {
            ...userData,
            ...extractedData,
            lastUpdated: Date.now(),
        };

        // Check if all required fields are filled
        const missingFields = Object.entries(userData)
            .filter(
                ([key, value]) =>
                    key !== "isComplete" && key !== "lastUpdated" && !value
            )
            .map(([key]) => key);

        userData.isComplete = missingFields.length === 0;

        const userMemory = await userDataManager.addEmbeddingToMemory({
            userId: message.userId,
            agentId,
            content: {
                text: JSON.stringify(userData),
                source: "userDataEvaluator",
            },
            roomId,
            createdAt: Date.now(),
            id: existingMemories[0]?.id,
        });

        await userDataManager.createMemory(userMemory, true);
        return true;
    } catch (error) {
        elizaLogger.error("Error in userDataEvaluator handler:", error);
        return false;
    }
}

async function validate(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
): Promise<boolean> {
    try {
        // Skip if message is from the agent
        if (message.userId === runtime.agentId) {
            return false;
        }

        const userDataManager = new MemoryManager({
            runtime,
            tableName: "user_data",
        });

        // Check if we already have complete user data
        const existingData = await userDataManager.searchMemoriesByEmbedding(
            message.embedding || [],
            {
                roomId: message.roomId,
                count: 1,
                match_threshold: 0.8,
            }
        );

        if (existingData.length > 0) {
            const data = JSON.parse(existingData[0].content.text) as UserData;
            if (data.isComplete) {
                return false;
            }
        }

        // Check if message might contain user data
        const relevantPatterns = [
            /\b(yes|no|attending|coming|can('t| not) make it)\b/i, // RSVP
            /\bmy name\b/i, // Name
            /\b(live|living|from|in|at)\b/i, // Location
            /\b(work|working|job|profession|employed|as a)\b/i, // Occupation
        ];

        return relevantPatterns.some((pattern) =>
            pattern.test(message.content.text || "")
        );
    } catch (error) {
        elizaLogger.error("Error in userDataEvaluator validate:", error);
        return false;
    }
}

export const userDataEvaluator: Evaluator = {
    name: "GET_USER_DATA",
    similes: ["GET_INFORMATION", "EXTRACT_INFORMATION", "UPDATE_USER_INFO"],
    validate,
    handler,
    description:
        "Extract and maintain user information including name, location, occupation, and RSVP status",
    examples: [],
};
