import { Tweet } from "agent-twitter-client";
import { elizaLogger } from "@ai16z/eliza";
import { IAgentRuntime, generateText } from "@ai16z/eliza";

export class TimelineAnalyzer {
    constructor(private runtime?: IAgentRuntime) {}

    private readonly themeAnalysisPrompt = `
        Analyze these tweets from my followers:
        {{tweets}}

        Identify the top 5 themes or topics being discussed.
        Return only the themes, one per line.
    `;

    private readonly topicSelectionPrompt = `
        These themes are trending among my followers:
        {{themes}}

        Select ONE topic that would be most engaging to tweet about.
        Consider:
        1. Current relevance
        2. Potential for engagement
        3. Alignment with my expertise
        4. Connection to {{characterName}}'s interests

        Context about {{characterName}}:
        {{characterBio}}
        {{characterLore}}

        Return only the selected topic.
    `;

    private async analyzeTimeline(tweets: Tweet[]): Promise<string[]> {
        if (!this.runtime) {
            throw new Error("Runtime not initialized");
        }

        try {
            const tweetsText = tweets.map((t) => t.text).join("\n");

            elizaLogger.info(
                `[TimelineAnalyzer] Analyzing tweets for themes: ${tweetsText}`
            );

            const context = this.themeAnalysisPrompt.replace(
                "{{tweets}}",
                tweetsText
            );

            elizaLogger.info("[TimelineAnalyzer] Analyzing tweets for themes");
            const response = await generateText({
                runtime: this.runtime,
                context,
                modelClass: "medium",
            });

            const themes = response
                .split("\n")
                .filter((theme) => theme.trim().length > 0);
            elizaLogger.info(
                `[TimelineAnalyzer] Identified ${themes.length} themes`
            );
            return themes;
        } catch (error) {
            elizaLogger.error(
                "[TimelineAnalyzer] Error analyzing tweets:",
                error
            );
            throw error;
        }
    }

    private async extractTopic(themes: string): Promise<string | null> {
        if (!this.runtime) {
            return null;
        }

        try {
            const context = this.topicSelectionPrompt
                .replace("{{themes}}", themes)
                .replace(/{{characterName}}/g, this.runtime.character.name)
                .replace(
                    "{{characterBio}}",
                    this.runtime.character.bio.join("\n")
                )
                .replace(
                    "{{characterLore}}",
                    this.runtime.character.lore.join("\n")
                );

            elizaLogger.log(
                `[TimelineAnalyzer] Selecting topic from themes: "${themes}"`
            );

            const response = await generateText({
                runtime: this.runtime,
                context,
                modelClass: "small",
            });
            const topic = response.trim();

            elizaLogger.log(`[TimelineAnalyzer] Selected topic: "${topic}"`);

            return topic;
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Error selecting topic: ${error}`
            );
            return null;
        }
    }

    async analyzeTimelineForTopic(tweets: Tweet[]): Promise<string> {
        try {
            // 1. Analyze for themes
            const themes = await this.analyzeTimeline(tweets);

            // 2. Select final topic
            const topic = await this.extractTopic(themes.join("\n"));

            return topic || "Ethereum and AI agents"; // Fallback topic
        } catch (error) {
            elizaLogger.error(
                "[TimelineAnalyzer] Error in timeline analysis:",
                error
            );
            return "Ethereum and AI agents"; // Fallback topic
        }
    }
}
