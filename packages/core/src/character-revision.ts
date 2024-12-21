import { IAgentRuntime, elizaLogger } from "./index";
import { generateText } from "./generation";
import { ModelClass } from "./types";

const revisionTemplate = `As an editor, review this message for {{characterName}}'s voice and style:

        Character Style Guidelines:
        {{characterStyle}}

        Character Example Messages:
        {{characterExamples}}

        message to review:
        {{originalText}}

        Instructions:
        1. Check if the message follows all style rules
        2. Verify it matches {{characterName}}'s voice
        3. Ensure that it stays on one topic

        If the message needs revision, respond with a completely new version of the message that fixes the issues.

        If the message is good as is, respond with the original message.

        Do not include any other text in your response.`;

export async function reviseForCharacter(
    originalText: string,
    runtime: IAgentRuntime
): Promise<string> {
    try {
        elizaLogger.log(
            `[Character Revision] Original text: "${originalText}"`
        );

        const context = revisionTemplate
            .replace(
                "{{characterStyle}}",
                runtime.character.style.all.join("\n")
            )
            .replace(
                "{{characterExamples}}",
                runtime.character.postExamples.join("\n")
            )
            .replace("{{originalText}}", originalText)
            .replace(/{{characterName}}/g, runtime.character.name);

        elizaLogger.log(
            `[Character Revision] Revising text to match character style, "${context}"`
        );

        const revisedText = await generateText({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.log(
            `[Character Revision] Revised text: "${revisedText.trim()}"`
        );

        return revisedText.trim();
    } catch (error) {
        elizaLogger.error("[Character Revision] Error revising text:", error);
        // Return original text if revision fails
        return originalText;
    }
}
