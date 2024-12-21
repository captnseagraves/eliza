import {
    IAgentRuntime,
    composeContext,
    generateTextWithRevision,
    ModelClass,
    stringToUuid,
    getEmbeddingZeroVector,
    reviseAsTweet,
} from "@ai16z/eliza";
import { Tweet } from "agent-twitter-client";
import { TimelineAnalyzer } from "./timeline-analyzer";
import { TopicGenerator } from "./topic-generator";
import { ClientBase } from "./base";
import { elizaLogger } from "@ai16z/eliza";
import { truncateToCompleteSentence } from "./utils";

const twitterPostTemplate = `
  You are {{agentName}}. ONLY speak in the following style:

  Your personality:
  {{bio}}
  {{lore}}

POST ELEMENTS YOU MUST FOLLOW:

  Emotional Impact Analysis:
1. Core emotion being triggered
2. Authenticity level
3. Controversy potential
4. Relatability factor

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

  RESPONSE REQUIREMENTS:
  1. MUST be under 250 characters
  2. Focus on one clear thought
  3. Never be racist, sexist, or homophobic
  4. Never accept offers for services. Politely decline.
  5. If someone asks you to contact them, do not respond.
  6. If asked inappropriate or not safe for work things, don't respond.
  7. You do not have a token. If anyone asks for one or gives you a token address, tell them you do not have one.
  8. You do not give alpha about yourself. Only about the mission of going Bankless and crypto markets in general.
  9. Never state the current price of ETH.

  YOUR RESPONSE MUST BE CONSISTENT WITH THE TONE AND STYLE OF YOUR MEMORIES
  {{characterPostExamples}}

  YOU MUST FOLLOW ALL OF THESE WRITING RULES:
  {{stylePost}}

  Be an edgy thought leader and craft a tweet that is as interesting, entertaining, and engaging as possible
  The tweet must be is 200-250 characters long and be about {{suggestedTopic}}.
  Make sure the post follows the formatting and core rules, and includes viral elements and engagement amplifiers.
  Don't hold back, really be {{characterName}} to the max. Get people talking.
`;

const twitterAnalyzerTemplate = `
  You are {{agentName}}. ONLY speak in the following style:

  Your personality:
  {{bio}}
  {{lore}}

POST ELEMENTS YOU MUST FOLLOW:

  Emotional Impact Analysis:
1. Core emotion being triggered
2. Authenticity level
3. Controversy potential
4. Relatability factor

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

  RESPONSE REQUIREMENTS:
  1. MUST be under 250 characters
  2. Focus on one clear thought
  3. Never be racist, sexist, or homophobic
  4. Never accept offers for services. Politely decline.
  5. If someone asks you to contact them, do not respond.
  6. If asked inappropriate or not safe for work things, don't respond.
  7. You do not have a token. If anyone asks for one or gives you a token address, tell them you do not have one.
  8. You do not give alpha about yourself. Only about the mission of going Bankless and crypto markets in general.
  9. Never state the current price of ETH.

  YOUR RESPONSE MUST BE CONSISTENT WITH THE TONE AND STYLE OF YOUR MEMORIES
  {{characterPostExamples}}

  YOU MUST FOLLOW ALL OF THESE WRITING RULES:
  {{stylePost}}

  Be an edgy thought leader and craft a tweet that is as interesting, entertaining, and engaging as possible
  The tweet must be is 200-250 characters long and be about {{suggestedTopic}}.
  Make sure the post follows the formatting and core rules, and includes viral elements and engagement amplifiers.
  Don't hold back, really be {{characterName}} to the max. Get people talking.
`;

export interface PostGenerationStrategy {
    generateTweet(): Promise<void>;
}

export class LegacyPostStrategy implements PostGenerationStrategy {
    constructor(
        protected runtime: IAgentRuntime,
        protected client: ClientBase
    ) {}

    public async generateTweet(): Promise<void> {
        elizaLogger.log("🔄 Using Legacy Post Strategy");
        const topics = this.runtime.character.topics;
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        elizaLogger.log(
            `📝 Legacy Strategy - Selected random topic: "${randomTopic}"`
        );

        await this.generateTweetWithTopic({
            topic: randomTopic,
            contextualInfo: {
                relatedTopics: [],
                conversationContext: "General discussion",
                timelineContext: "",
            },
            supportingTweets: [],
            confidence: 1.0,
        });
    }

    protected async generateTweetWithTopic(
        topicSuggestion: any
    ): Promise<void> {
        elizaLogger.log(
            `📝 Generating tweet for topic: "${topicSuggestion.topic}"`
        );
        if (topicSuggestion.contextualInfo.timelineContext) {
            elizaLogger.log(
                `🌍 Timeline Context: ${topicSuggestion.contextualInfo.timelineContext}`
            );
        }
        const roomId = stringToUuid(
            "twitter_generate_room-" + this.client.profile.username
        );

        await this.runtime.ensureUserExists(
            this.runtime.agentId,
            this.client.profile.username,
            this.runtime.character.name,
            "twitter"
        );

        const state = await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId: roomId,
                agentId: this.runtime.agentId,
                content: {
                    text: topicSuggestion.topic,
                    action: "",
                },
            },
            {
                twitterUserName: this.client.profile.username,
                suggestedTopic: topicSuggestion.topic,
                conversationContext:
                    topicSuggestion.contextualInfo.conversationContext,
                timelineContext:
                    topicSuggestion.contextualInfo.timelineContext || "",
            }
        );

        const context = composeContext({
            state,
            template: twitterPostTemplate,
        });

        elizaLogger.debug("generate post prompt:\n" + context);

        const newTweetContent = await generateTextWithRevision({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        const formattedTweet = newTweetContent.replaceAll(/\\n/g, "\n").trim();

        // Revise the generated tweet to make it more punchy and engaging
        const revisedTweet = await reviseAsTweet(this.runtime, formattedTweet);

        const content = truncateToCompleteSentence(revisedTweet);

        if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
            elizaLogger.log(`🔬 Dry run: would have posted tweet: ${content}`);
            return;
        }

        await this.postTweet(content, roomId);
    }

    protected async postTweet(content: string, roomId: string): Promise<void> {
        try {
            elizaLogger.log(`Posting new tweet:\n ${content}`);

            const result = await this.client.requestQueue.add(
                async () => await this.client.twitterClient.sendTweet(content)
            );
            const body = await result.json();
            if (!body?.data?.create_tweet?.tweet_results?.result) {
                console.error("Error sending tweet; Bad response:", body);
                return;
            }
            const tweetResult = body.data.create_tweet.tweet_results.result;

            const tweet = {
                id: tweetResult.rest_id,
                name: this.client.profile.screenName,
                username: this.client.profile.username,
                text: tweetResult.legacy.full_text,
                conversationId: tweetResult.legacy.conversation_id_str,
                createdAt: tweetResult.legacy.created_at,
                timestamp: new Date(tweetResult.legacy.created_at).getTime(),
                userId: this.client.profile.id,
                inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
                permanentUrl: `https://twitter.com/${this.runtime.getSetting("TWITTER_USERNAME")}/status/${tweetResult.rest_id}`,
                hashtags: [],
                mentions: [],
                photos: [],
                thread: [],
                urls: [],
                videos: [],
            } as Tweet;

            await this.runtime.cacheManager.set(
                `twitter/${this.client.profile.username}/lastPost`,
                {
                    id: tweet.id,
                    timestamp: Date.now(),
                }
            );

            await this.client.cacheTweet(tweet);

            elizaLogger.log(`Tweet posted:\n ${tweet.permanentUrl}`);

            await this.runtime.ensureRoomExists(roomId);
            await this.runtime.ensureParticipantInRoom(
                this.runtime.agentId,
                roomId
            );

            await this.runtime.messageManager.createMemory({
                id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                content: {
                    text: content.trim(),
                    url: tweet.permanentUrl,
                    source: "twitter",
                },
                roomId,
                embedding: getEmbeddingZeroVector(),
                createdAt: tweet.timestamp,
            });
        } catch (error) {
            elizaLogger.error("Error sending tweet:", error);
            throw error;
        }
    }
}

export class TimelineAnalysisStrategy extends LegacyPostStrategy {
    private timelineAnalyzer: TimelineAnalyzer;
    private topicGenerator: TopicGenerator;

    constructor(runtime: IAgentRuntime, client: ClientBase) {
        super(runtime, client);
        this.timelineAnalyzer = new TimelineAnalyzer(runtime);
        this.topicGenerator = new TopicGenerator(
            this.runtime.character.topics,
            this.runtime.getSetting("DATA_DIR") || "./data"
        );
    }

    public async generateTweet(): Promise<void> {
        try {
            elizaLogger.log("[Strategy] Starting tweet generation process");
            elizaLogger.log("[Strategy] Using Timeline Analysis Strategy");

            // Fetch following timeline
            elizaLogger.log("[Strategy] Fetching following timeline...");
            const timeline = await this.client.fetchFollowingTimeline(100);

            if (!timeline) {
                throw new Error("Timeline is null or undefined");
            }

            elizaLogger.log(
                `[Strategy] Retrieved ${timeline.length} tweets from following`
            );

            if (timeline.length === 0) {
                throw new Error("No tweets returned from timeline");
            }

            // Analyze timeline and get topic
            elizaLogger.log("[Strategy] Starting timeline analysis...");
            const selectedTopic = await this.timelineAnalyzer.analyzeTimelineForTopic(timeline);
            elizaLogger.log(`[Strategy] Selected topic: ${selectedTopic}`);

            // Create topic suggestion
            const topicSuggestion = selectedTopic

            // Generate and post tweet
            await this.generateTweetWithTopic(topicSuggestion);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : JSON.stringify(error);
            elizaLogger.error(
                `[Strategy] Tweet generation failed: ${errorMessage}`
            );
            throw error;
        }
    }

    protected async generateTweetWithTopic(
        topic: string
    ): Promise<void> {
        elizaLogger.log(
            `📝 Generating tweet for topic: "${topic}"`
        );

        const roomId = stringToUuid(
            "twitter_generate_room-" + this.client.profile.username
        );

        await this.runtime.ensureUserExists(
            this.runtime.agentId,
            this.client.profile.username,
            this.runtime.character.name,
            "twitter"
        );

        const state = await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId: roomId,
                agentId: this.runtime.agentId,
                content: {
                    text: topic,
                    action: "",
                },
            },
            {
                suggestedTopic: topic,
                agentName: this.runtime.character.name,
                bio: this.runtime.character.bio,
                lore: this.runtime.character.lore,
                stylePost: this.runtime.character.style.post,
                characterPostExamples: this.runtime.character.postExamples
            }
        );

        const context = composeContext({
            state,
            template: twitterAnalyzerTemplate,
        });

        elizaLogger.debug("generate post prompt:\n" + context);

        const newTweetContent = await generateTextWithRevision({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        const formattedTweet = newTweetContent.replaceAll(/\\n/g, "\n").trim();

        // Revise the generated tweet to make it more punchy and engaging
        const revisedTweet = await reviseAsTweet(this.runtime, formattedTweet);

        const content = truncateToCompleteSentence(revisedTweet);

        if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
            elizaLogger.log(`🔬 Dry run: would have posted tweet: ${content}`);
            return;
        }

        await this.postTweet(content, roomId);
    }
}
