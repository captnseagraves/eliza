import { IAgentRuntime, elizaLogger } from "./index.js";
import { generateText } from "./generation.js";
import { ModelClass } from "./types.js";
import { messageCompletionFooter } from "./parsing";

const longFormRevisionTemplate = `As an editor, review this message for {{characterName}}'s voice and style:

Engagement Amplifiers:
- Pattern interrupts
- Open loops
- Universal truths
- Contrarian takes
- Hot takes
- Storytelling hooks

Viral Elements Required:
1. First line hook
2. Unexpected twist
3. Memorable insight
4. Discussion starter
5. Share motivation

Voice & Style:
- Personal yet authoritative
- Bold yet authentic
- Casual yet profound
- Raw yet polished

Core Rules:
1. Must evoke strong emotion
2. Must provide unique insight
3. Must compel sharing
4. Must start conversations

Formatting Rules:
- Short, punchy sentences
- Strategic line breaks
- Power words
- No weak qualifiers
- End with punch

Make sure the post follows the formatting and core rules, and includes viral elements and engagement amplifiers.
Do not provide any analysis of these elements in your response.

        Character Style Guidelines:
        {{characterStyle}}

        message to review:
        {{originalText}}

        Instructions:
        1. Check if the message follows all style rules
        2. Verify it matches {{characterName}}'s voice
        3. Ensure that it stays on one topic
        4. Never use emojis

        Rewrite the message to be as interesting, entertaining, and engaging as possible.
        Don't hold back, really be {{characterName}} to the max.

        Message MUST be fewer then 250 words.
        Only respond with the revised message. Do not tell us it is the message. Do not include any other text in your response.`;

const tweetRevisionTemplate = `As an editor, create a punchy tweet from this message for {{characterName}}'s voice and style:

Instructions:
1. Select the 2-4 most inspiring, viral, and engaging sentences from the original text
2. Condense and rephrase them into a single powerful coherent tweet
3. Ensure the tweet maintains the core message while being more engaging

Tweet Requirements:
- Must have a strong hook
- Must be clear and concise
- Must maintain emotional impact
- Must encourage engagement
- Must be under 250 characters
- Use Strategic line breaks
- No Emojis
- No hashtags

Character Style Guidelines:
{{characterStyle}}

Original text:
{{originalText}}

Provide only the final tweet, no explanations or analysis.`;

const messageRevisionTemplate =
    `As an editor, review and improve this message for {{characterName}}'s voice and style:

Core Requirements:
1. Must maintain core message
2. Must be clear and engaging
3. Must match character voice
4. Must be concise

Character Style Guidelines:
{{characterStyle}}

Original text:
{{originalText}}

Rewrite to match {{characterName}}'s style while keeping the core message intact.
Focus on being brief, conversational, and entertaining.
Provide only the revised message, no explanations.
Include an action, if appropriate. {{actionNames}}` + messageCompletionFooter;

export async function reviseForCharacter(
    originalText: string,
    runtime: IAgentRuntime
): Promise<string> {
    try {
        let currentText = originalText;

        for (let i = 1; i <= 3; i++) {
            elizaLogger.log(
                `[Character Revision] Pass ${i} - Original text: "${currentText}"`
            );

            const context = longFormRevisionTemplate
                .replace(
                    "{{characterStyle}}",
                    runtime.character.style.all.join("\n")
                )
                .replace("{{originalText}}", currentText)
                .replace(/{{characterName}}/g, runtime.character.name);

            elizaLogger.log(
                `[Character Revision] Pass ${i} - Revising text to match character style`
            );

            const revisedText = await generateText({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
            });

            currentText = revisedText.trim();
            elizaLogger.log(
                `[Character Revision] Pass ${i} - Revised text: "${currentText}"`
            );
        }

        return currentText;
    } catch (error) {
        elizaLogger.error("[Character Revision] Error revising text:", error);
        // Return original text if revision fails
        return originalText;
    }
}

export async function reviseAsTweet(
    runtime: IAgentRuntime,
    originalText: string
): Promise<string> {
    try {
        const context = tweetRevisionTemplate
            .replace(
                "{{characterStyle}}",
                runtime.character.style.all.join("\n")
            )
            .replace("{{originalText}}", originalText)
            .replace(/{{characterName}}/g, runtime.character.name);

        elizaLogger.log("Revising as tweet with context:", originalText);

        const revisedText = await generateText({
            runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        return revisedText.trim();
    } catch (error) {
        elizaLogger.error("[Tweet Revision] Error revising tweet:", error);
        // Return original text if revision fails
        return originalText;
    }
}

export async function reviseMessage(
    runtime: IAgentRuntime,
    originalText: string
): Promise<string> {
    try {
        const context = messageRevisionTemplate
            .replace(
                "{{characterStyle}}",
                runtime.character.style.all.join("\n")
            )
            .replace("{{originalText}}", originalText)
            .replace(/{{characterName}}/g, runtime.character.name);

        elizaLogger.log("[General Revision] Revising text:", originalText);

        const revisedText = await generateText({
            runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        return revisedText.trim();
    } catch (error) {
        elizaLogger.error("[General Revision] Error revising text:", error);
        return originalText;
    }
}
