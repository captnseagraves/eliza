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
                `[TimelineAnalyzer] Starting analysis of tweet: ${JSON.stringify(
                    {
                        id: tweet?.id,
                        hasText: !!tweet?.text,
                        hasId: !!tweet?.id,
                        favoriteCount: tweet?.favoriteCount,
                        retweetCount: tweet?.retweetCount,
                        replyCount: tweet?.replyCount,
                        quoteCount: tweet?.quoteCount,
                    },
                    null,
                    2
                )}`
            );

            if (!tweet || !tweet.id) {
                throw new Error(
                    `Invalid tweet object: ${JSON.stringify(tweet)}`
                );
            }

            if (!tweet.text) {
                throw new Error(`Tweet ${tweet.id} has no text content`);
            }

            const engagement: TweetEngagement = {
                likes: tweet.favoriteCount || 0,
                retweets: tweet.retweetCount || 0,
                replies: tweet.replyCount || 0,
                quotes: tweet.quoteCount || 0,
            };

            elizaLogger.log(
                `[TimelineAnalyzer] Tweet ${tweet.id} engagement metrics: ${JSON.stringify(engagement, null, 2)}`
            );

            const topic = await this.extractTopic(tweet.text);
            const topicScore = this.calculateTopicScore(tweet, topic);

            elizaLogger.log(
                `[TimelineAnalyzer] Tweet ${tweet.id} topic score: ${topicScore}`
            );

            return {
                tweetId: tweet.id,
                engagement,
                topicScore,
                topics: topic ? [topic] : [],
                clusterIds: [],
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : JSON.stringify(error);
            elizaLogger.error(
                `[TimelineAnalyzer] Tweet analysis error: ${errorMessage}`
            );
            if (error instanceof Error && error.stack) {
                elizaLogger.error(
                    `[TimelineAnalyzer] Stack trace: ${error.stack}`
                );
            }
            throw error;
        }
    }

    private async extractTopic(text: string): Promise<string | null> {
        if (!this.runtime) {
            return null;
        }

        try {
            const prompt = `
            Analyze the following tweet and extract its main topic.
            Return only the single most relevant topic, with no additional text.
            The topic should be a short phrase (1-3 words) that captures the main subject.

            Tweet: "${text}"
            `;

            const response = await generateText({
                runtime: this.runtime,
                context: prompt,
                modelClass: "small"
            });
            const topic = response.trim();
            return topic || null;
        } catch (error) {
            elizaLogger.error(`Error extracting topic: ${error}`);
            return null;
        }
    }

    private async formClusters(
        tweets: Tweet[],
        individualAnalyses: TimelineAnalysis["individual"]
    ) {
        // First, collect all unique topics
        const uniqueTopics = new Set<string>();
        individualAnalyses.forEach(analysis => {
            if (analysis.topics[0] && analysis.topics[0] !== "uncategorized") {
                uniqueTopics.add(analysis.topics[0]);
            }
        });

        // Create topic similarity groups
        const topicGroups: { mainTopic: string; similarTopics: Set<string> }[] = [];
        const processedTopics = new Set<string>();

        for (const topic of uniqueTopics) {
            if (processedTopics.has(topic)) continue;

            const similarTopics = new Set<string>([topic]);
            processedTopics.add(topic);

            // Compare with other unprocessed topics
            for (const otherTopic of uniqueTopics) {
                if (processedTopics.has(otherTopic)) continue;

                const areSimilar = await this.areTopicsSimilar(topic, otherTopic);
                if (areSimilar) {
                    similarTopics.add(otherTopic);
                    processedTopics.add(otherTopic);
                }
            }

            topicGroups.push({
                mainTopic: topic,
                similarTopics
            });
        }

        // Create clusters based on topic groups
        const topicClusters = new Map<
            string,
            {
                tweets: Tweet[];
                analyses: TimelineAnalysis["individual"][0][];
            }
        >();

        // Initialize clusters with main topics
        topicGroups.forEach(group => {
            topicClusters.set(group.mainTopic, { tweets: [], analyses: [] });
        });

        // Assign tweets to clusters
        individualAnalyses.forEach((analysis, index) => {
            const tweet = tweets[index];
            const tweetTopic = analysis.topics[0];

            if (!tweetTopic || tweetTopic === "uncategorized") return;

            // Find the group this topic belongs to
            const group = topicGroups.find(g => g.similarTopics.has(tweetTopic));
            if (group) {
                const cluster = topicClusters.get(group.mainTopic)!;
                cluster.tweets.push(tweet);
                cluster.analyses.push(analysis);
            }
        });

        // Convert clusters to final format
        return Array.from(topicClusters.entries())
            .filter(([_, cluster]) => cluster.tweets.length > 0)
            .map(([topic, cluster]) => {
                const engagement = this.calculateClusterEngagement(cluster.tweets);

                // Calculate total engagement score
                const engagementScore =
                    engagement.likes +
                    (engagement.retweets * 2) + // Weight retweets more
                    (engagement.replies * 1.5) + // Weight replies slightly more
                    engagement.quotes;

                // Calculate engagement rate (per tweet)
                const engagementRate = engagementScore / cluster.tweets.length;

                return {
                    clusterId: topic.replace(/\s+/g, "-").toLowerCase(),
                    topic: topic,
                    totalEngagement: engagement,
                    tweets: cluster.tweets.map((t) => t.id),
                    engagementScore,
                    engagementRate,
                    participantCount: engagement.participantCount,
                };
            })
            .sort((a, b) => b.engagementScore - a.engagementScore); // Sort by engagement score
    }

    private async areTopicsSimilar(topic1: string, topic2: string): Promise<boolean> {
        if (!this.runtime) return false;

        try {
            const prompt = `
            Compare these two topics and determine if they are semantically similar or related enough to be grouped together.
            Answer with only "yes" or "no".

            Topic 1: "${topic1}"
            Topic 2: "${topic2}"
            `;

            const response = await generateText({
                runtime: this.runtime,
                context: prompt,
                modelClass: "small"
            });
            return response.trim().toLowerCase() === "yes";
        } catch (error) {
            elizaLogger.error(`Error comparing topics: ${error}`);
            return false;
        }
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
        const maxDepth = Math.max(...tweets.map((t) => t.conversationDepth || 0));

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
            const validTweets = tweets.filter(tweet => 
                tweet && 
                tweet.id && 
                tweet.text && 
                typeof tweet.id === 'string' &&
                typeof tweet.text === 'string'
            );

            if (validTweets.length === 0) {
                throw new Error("No valid tweets found for analysis");
            }

            elizaLogger.log(
                `[TimelineAnalyzer] Starting analysis of ${validTweets.length} tweets`
            );

            const individual = await Promise.all(validTweets.map(tweet => this.analyzeTweet(tweet)));
            const clusters = await this.formClusters(validTweets, individual);

            return {
                individual,
                clusters
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
