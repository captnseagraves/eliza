import { Tweet } from "agent-twitter-client";
import { elizaLogger } from "@ai16z/eliza";
import { IAgentRuntime, generateText } from "@ai16z/eliza";

export interface TweetEngagement {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
}

export interface ClusterEngagement extends TweetEngagement {
    participantCount: number;
    conversationDepth: number;
}

export interface TimelineAnalysis {
    individual: {
        tweetId: string;
        engagement: TweetEngagement;
        topicScore: number;
        topics: string[];
        clusterIds: string[];
    }[];
    clusters: {
        clusterId: string;
        topic: string;
        totalEngagement: ClusterEngagement;
        tweets: string[];
        engagementScore: number;
        engagementRate: number;
        participantCount: number;
    }[];
}

export class TimelineAnalyzer {
    constructor(private runtime?: IAgentRuntime) {}

    private async analyzeTweet(tweet: Tweet) {
        try {
            elizaLogger.log(
                `[TimelineAnalyzer] Analyzing tweet: "${tweet.text}"`
            );

            const topic = await this.extractTopic(tweet.text || "");
            const topicScore = this.calculateTopicScore(tweet, topic);

            elizaLogger.log(
                `[TimelineAnalyzer] Generated topic: "${topic}" with score: ${topicScore} for tweet`
            );

            const engagement = {
                likes: tweet.favoriteCount || 0,
                retweets: tweet.retweetCount || 0,
                replies: tweet.replyCount || 0,
                quotes: tweet.quoteCount || 0,
            };

            elizaLogger.log(
                `[TimelineAnalyzer] Tweet engagement metrics - Likes: ${engagement.likes}, Retweets: ${engagement.retweets}, Replies: ${engagement.replies}, Quotes: ${engagement.quotes}`
            );

            return {
                tweetId: tweet.id || "",
                engagement,
                topicScore,
                topics: topic ? [topic] : ["uncategorized"],
                clusterIds: [],
            };
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Failed to analyze tweet: ${tweet.text}. Error: ${error}`
            );
            throw error;
        }
    }

    private async extractTopic(text: string): Promise<string | null> {
        if (!this.runtime) {
            return null;
        }

        try {
            const prompt = `
            Analyze the following tweet and write short sentence about its main topic.
            Return only the short sentence without any other text or explanation.
            MUST be longer than 10 words.

            Tweet: "${text}"
            `;

            elizaLogger.log(
                `[TimelineAnalyzer] Extracting topic for tweet: "${text}"`
            );

            const response = await generateText({
                runtime: this.runtime,
                context: prompt,
                modelClass: "small",
            });
            const topic = response.trim();

            elizaLogger.log(
                `[TimelineAnalyzer] Extracted topic: "${topic}" for tweet`
            );

            return topic || null;
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Error extracting topic: ${error}`
            );
            return null;
        }
    }

    private async areTopicsSimilar(
        topic1: string,
        topic2: string
    ): Promise<boolean> {
        if (!this.runtime) return false;

        try {
            elizaLogger.log(
                `[TimelineAnalyzer] Comparing topics: "${topic1}" and "${topic2}"`
            );

            const prompt = `
            Compare these two topics and determine if they are semantically similar or related enough to be grouped together.
            Answer with only "yes" or "no".

            Topic 1: "${topic1}"
            Topic 2: "${topic2}"
            `;

            const response = await generateText({
                runtime: this.runtime,
                context: prompt,
                modelClass: "small",
            });
            const result = response.trim().toLowerCase() === "yes";

            elizaLogger.log(
                `[TimelineAnalyzer] Topics "${topic1}" and "${topic2}" are ${result ? "similar" : "not similar"}`
            );

            return result;
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Error comparing topics: ${error}`
            );
            return false;
        }
    }

    private async formClusters(
        tweets: Tweet[],
        individualAnalyses: TimelineAnalysis["individual"]
    ) {
        elizaLogger.log(
            `[TimelineAnalyzer] Starting cluster formation with ${tweets.length} tweets`
        );

        // Create topic similarity groups
        const topicGroups: { mainTopic: string; similarTopics: Set<string> }[] =
            [];
        const processedTopics = new Set<string>();

        for (const analysis of individualAnalyses) {
            const topic = analysis.topics[0];
            if (
                !topic ||
                topic === "uncategorized" ||
                processedTopics.has(topic)
            )
                continue;

            elizaLogger.log(
                `[TimelineAnalyzer] Processing topic group for: "${topic}"`
            );

            const similarTopics = new Set<string>([topic]);
            processedTopics.add(topic);

            // Find similar topics
            for (const otherAnalysis of individualAnalyses) {
                const otherTopic = otherAnalysis.topics[0];
                if (
                    !otherTopic ||
                    otherTopic === "uncategorized" ||
                    processedTopics.has(otherTopic)
                )
                    continue;

                if (await this.areTopicsSimilar(topic, otherTopic)) {
                    similarTopics.add(otherTopic);
                    processedTopics.add(otherTopic);
                }
            }

            topicGroups.push({ mainTopic: topic, similarTopics });
            elizaLogger.log(
                `[TimelineAnalyzer] Created topic group with main topic "${topic}" and similar topics: ${Array.from(similarTopics).join(", ")}`
            );
        }

        // Initialize clusters with main topics
        const topicClusters = new Map<
            string,
            { tweets: Tweet[]; analyses: TimelineAnalysis["individual"][0][] }
        >();
        topicGroups.forEach((group) => {
            topicClusters.set(group.mainTopic, { tweets: [], analyses: [] });
        });

        // Assign tweets to clusters
        individualAnalyses.forEach((analysis, index) => {
            const tweet = tweets[index];
            const tweetTopic = analysis.topics[0];

            if (!tweetTopic || tweetTopic === "uncategorized") return;

            // Find the group this topic belongs to
            const group = topicGroups.find((g) =>
                g.similarTopics.has(tweetTopic)
            );
            if (group) {
                const cluster = topicClusters.get(group.mainTopic)!;
                cluster.tweets.push(tweet);
                cluster.analyses.push(analysis);
                elizaLogger.log(
                    `[TimelineAnalyzer] Assigned tweet "${tweet.text}" to cluster "${group.mainTopic}"`
                );
            }
        });

        // Convert clusters to final format
        const finalClusters = Array.from(topicClusters.entries())
            .filter(([_, cluster]) => cluster.tweets.length > 0)
            .map(([topic, cluster]) => {
                const engagement = this.calculateClusterEngagement(
                    cluster.tweets
                );
                const engagementScore =
                    engagement.likes +
                    engagement.retweets * 2 +
                    engagement.replies * 1.5 +
                    engagement.quotes;
                const engagementRate = engagementScore / cluster.tweets.length;

                elizaLogger.log(
                    `[TimelineAnalyzer] Cluster "${topic}" metrics:
                    - Tweet count: ${cluster.tweets.length}
                    - Total engagement score: ${engagementScore}
                    - Engagement rate: ${engagementRate}
                    - Participant count: ${engagement.participantCount}
                    - Conversation depth: ${engagement.conversationDepth}`
                );

                return {
                    clusterId: topic.replace(/\s+/g, "-").toLowerCase(),
                    topic: topic,
                    totalEngagement: engagement,
                    tweets: cluster.tweets.map((t) => t.id!),
                    engagementScore,
                    engagementRate,
                    participantCount: engagement.participantCount,
                };
            });

        elizaLogger.log(
            `[TimelineAnalyzer] Formed ${finalClusters.length} clusters from ${tweets.length} tweets`
        );

        return finalClusters;
    }

    private calculateTopicScore(tweet: Tweet, topic: string | null): number {
        try {
            if (!tweet.text) {
                return 0;
            }

            const engagementScore =
                (tweet.favoriteCount || 0) * 1 +
                (tweet.retweetCount || 0) * 2 +
                (tweet.replyCount || 0) * 1.5 +
                (tweet.quoteCount || 0) * 1.5;

            return engagementScore;
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Error calculating topic relevance: ${error}`
            );
            return 0;
        }
    }

    private calculateClusterEngagement(tweets: Tweet[]): ClusterEngagement {
        // Calculate total engagement metrics
        const totalEngagement = tweets.reduce(
            (acc, tweet) => {
                acc.likes += tweet.favoriteCount || 0;
                acc.retweets += tweet.retweetCount || 0;
                acc.replies += tweet.replyCount || 0;
                acc.quotes += tweet.quoteCount || 0;
                return acc;
            },
            { likes: 0, retweets: 0, replies: 0, quotes: 0 }
        );

        // Calculate unique participants
        const participants = new Set(tweets.map((t) => t.userId));

        // Calculate conversation depth (max reply depth in thread)
        const maxDepth = Math.max(
            ...tweets.map((t) => t.conversationDepth || 0)
        );

        return {
            ...totalEngagement,
            participantCount: participants.size,
            conversationDepth: maxDepth,
        };
    }

    public async analyzeTimeline(tweets: Tweet[]): Promise<TimelineAnalysis> {
        try {
            if (!tweets || tweets.length === 0) {
                throw new Error("No tweets provided for analysis");
            }

            // Filter out invalid tweets
            const validTweets = tweets.filter(
                (tweet) =>
                    tweet &&
                    tweet.id &&
                    tweet.text &&
                    typeof tweet.id === "string" &&
                    typeof tweet.text === "string"
            );

            if (validTweets.length === 0) {
                throw new Error("No valid tweets found for analysis");
            }

            elizaLogger.log(
                `[TimelineAnalyzer] Starting analysis of ${validTweets.length} tweets`
            );

            const individual = await Promise.all(
                validTweets.map((tweet) => this.analyzeTweet(tweet))
            );
            const clusters = await this.formClusters(validTweets, individual);

            return {
                individual,
                clusters,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : JSON.stringify(error);
            elizaLogger.error(
                `[TimelineAnalyzer] Analysis failed: ${errorMessage}`
            );
            if (error instanceof Error && error.stack) {
                elizaLogger.error(
                    `[TimelineAnalyzer] Stack trace: ${error.stack}`
                );
            }
            throw error;
        }
    }
}
