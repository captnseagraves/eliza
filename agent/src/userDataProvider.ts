import {
    MemoryManager,
    Memory,
    Provider,
    State,
    IAgentRuntime,
    elizaLogger,
    formatMessages,
} from "@ai16z/eliza";

interface UserData {
    rsvpStatus: string | undefined;
    name: string | undefined;
    location: string | undefined;
    occupation: string | undefined;
    isComplete: boolean;
    lastUpdated: number;
}

const formatUserData = (data: UserData): string => {
    const fields = [
        data.name ? `Name: ${data.name}` : null,
        data.location ? `Location: ${data.location}` : null,
        data.occupation ? `Occupation: ${data.occupation}` : null,
        data.rsvpStatus ? `RSVP Status: ${data.rsvpStatus}` : null,
    ];

    const presentFields = fields.filter((field) => field !== null);

    if (presentFields.length === 0) {
        return "No user information available yet.";
    }

    return presentFields.join("\n");
};

export const userDataProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> {
        try {
            const recentMessagesData = state?.recentMessagesData?.slice(-10);
            const recentMessages = formatMessages({
                messages: recentMessagesData,
                actors: state?.actorsData,
            });

            const memoryManager = new MemoryManager({
                runtime,
                tableName: "user_data",
            });

            const userData = await memoryManager.getMemories({
                roomId: message.roomId,
                count: 10,
                start: 0,
                end: Date.now(),
            });

            if (!userData || userData.length === 0) {
                return "I don't have any information about you yet. Could you tell me your name and whether you'll be attending dinner?";
            }

            const userInfo = JSON.parse(userData[0].content.text) as UserData;
            const formattedData = formatUserData(userInfo);

            return `Here's what I know about you:\n${formattedData}`;
        } catch (error) {
            elizaLogger.error("Error in userDataProvider:", error);
            return "I'm having trouble accessing your information. Could you tell me your name and whether you'll be attending dinner?";
        }
    },
};
