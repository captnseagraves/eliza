import { Tweet } from "agent-twitter-client";
import { elizaLogger } from "@ai16z/eliza";

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
        topicRelevance: number;
        clusterIds: string[];
    }[];
    clusters: {
        clusterId: string;
        topic: string;
        totalEngagement: ClusterEngagement;
        momentum: number;
        tweets: string[];
        duration: number;
    }[];
    aggregateMetrics: {
        topPerformingTopics: string[];
        sustainedDiscussions: string[];
        emergingTrends: string[];
    };
}

export const ANALYSIS_WEIGHTS = {
    recency: 0.2,
    engagement: 0.4,
    clusterRelevance: 0.4,
};

export class TimelineAnalyzer {
    private async processTweetBatch(tweets: Tweet[], batchSize: number = 100) {
        const batches = this.chunkArray(tweets, batchSize);
        return Promise.all(batches.map((batch) => this.analyzeBatch(batch)));
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    private async analyzeBatch(tweets: Tweet[]) {
        const individualAnalysis = tweets.map((tweet) =>
            this.analyzeTweet(tweet)
        );
        const clusters = this.formClusters(tweets);
        return { individual: individualAnalysis, clusters };
    }

    private analyzeTweet(tweet: Tweet) {
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

            const topicRelevance = this.calculateTopicRelevance(tweet);
            elizaLogger.log(
                `[TimelineAnalyzer] Tweet ${tweet.id} topic relevance: ${topicRelevance}`
            );

            return {
                tweetId: tweet.id,
                engagement,
                topicRelevance,
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

    private calculateTopicRelevance(tweet: Tweet): number {
        try {
            if (!tweet.text) {
                return 0;
            }
            // Simple relevance calculation based on engagement
            const engagementScore =
                (tweet.favoriteCount || 0) * 1 +
                (tweet.retweetCount || 0) * 2 +
                (tweet.replyCount || 0) * 1.5 +
                (tweet.quoteCount || 0) * 1.5;

            return Math.min(engagementScore / 1000, 1); // Normalize to 0-1
        } catch (error) {
            elizaLogger.error(
                `[TimelineAnalyzer] Error calculating topic relevance: ${error}`
            );
            return 0;
        }
    }

    private formClusters(tweets: Tweet[]) {
        // Group tweets into clusters based on conversation threads and topic similarity
        // This is a placeholder implementation
        const clusters = new Map<string, Tweet[]>();

        tweets.forEach((tweet) => {
            const conversationId = tweet.conversationId || tweet.id;
            if (!clusters.has(conversationId)) {
                clusters.set(conversationId, []);
            }
            clusters.get(conversationId)?.push(tweet);
        });

        return Array.from(clusters.entries()).map(
            ([clusterId, clusterTweets]) => ({
                clusterId,
                topic: this.extractClusterTopic(clusterTweets),
                totalEngagement: this.calculateClusterEngagement(clusterTweets),
                momentum: this.calculateClusterMomentum(clusterTweets),
                tweets: clusterTweets.map((t) => t.id),
                duration: this.calculateClusterDuration(clusterTweets),
            })
        );
    }

    private extractClusterTopic(tweets: Tweet[]): string {
        // Find first non-retweet tweet
        const originalTweet = tweets.find((t) => !t.text?.startsWith("RT @"));
        return originalTweet?.text?.slice(0, 50) || "Unknown Topic";
    }

    private calculateClusterEngagement(tweets: Tweet[]): ClusterEngagement {
        const participants = new Set(tweets.map((t) => t.userId));
        const maxDepth = Math.max(
            ...tweets.map((t) => t.conversationDepth || 0)
        );

        return {
            likes: tweets.reduce((sum, t) => sum + (t.favoriteCount || 0), 0),
            retweets: tweets.reduce((sum, t) => sum + (t.retweetCount || 0), 0),
            replies: tweets.reduce((sum, t) => sum + (t.replyCount || 0), 0),
            quotes: tweets.reduce((sum, t) => sum + (t.quoteCount || 0), 0),
            participantCount: participants.size,
            conversationDepth: maxDepth,
        };
    }

    private calculateClusterMomentum(tweets: Tweet[]): number {
        // Calculate momentum based on engagement over time
        // This is a placeholder implementation
        return tweets.length;
    }

    private calculateClusterDuration(tweets: Tweet[]): number {
        const timestamps = tweets.map((t) =>
            new Date(t.timestamp * 1000).getTime()
        );
        const newest = Math.max(...timestamps);
        const oldest = Math.min(...timestamps);
        return newest - oldest;
    }

    public async analyzeTimeline(tweets: Tweet[]): Promise<TimelineAnalysis> {
        try {
            if (!tweets || tweets.length === 0) {
                throw new Error("No tweets provided for analysis");
            }

            elizaLogger.log(
                `[TimelineAnalyzer] Starting analysis of ${tweets.length} tweets`
            );

            // Log sample tweet structure
            if (tweets[0]) {
                elizaLogger.log(
                    `[TimelineAnalyzer] First tweet: ${JSON.stringify({
                        id: tweets[0].id,
                        text: tweets[0].text?.substring(0, 100),
                        hasText: !!tweets[0].text,
                        hasId: !!tweets[0].id,
                    })}`
                );
            }

            try {
                elizaLogger.log(
                    "[TimelineAnalyzer] Processing tweet batches..."
                );
                const batchResults = await this.processTweetBatch(tweets);
                elizaLogger.log(
                    `[TimelineAnalyzer] Processed ${batchResults.length} batches`
                );

                const individual = batchResults.flatMap((r) => r.individual);
                const clusters = batchResults.flatMap((r) => r.clusters);
                elizaLogger.log(
                    `[TimelineAnalyzer] Found ${individual.length} individual tweets and ${clusters.length} clusters`
                );

                // Calculate aggregate metrics
                elizaLogger.log("[TimelineAnalyzer] Calculating metrics...");
                const aggregateMetrics = {
                    topPerformingTopics:
                        this.extractTopPerformingTopics(clusters),
                    sustainedDiscussions:
                        this.extractSustainedDiscussions(clusters),
                    emergingTrends: this.extractEmergingTrends(clusters),
                };

                elizaLogger.log(
                    `[TimelineAnalyzer] Metrics calculated: ${JSON.stringify(aggregateMetrics)}`
                );

                return {
                    individual,
                    clusters,
                    aggregateMetrics,
                };
            } catch (processingError) {
                const errorMessage =
                    processingError instanceof Error
                        ? processingError.message
                        : JSON.stringify(processingError);
                elizaLogger.error(
                    `[TimelineAnalyzer] Processing error: ${errorMessage}`
                );
                if (processingError instanceof Error && processingError.stack) {
                    elizaLogger.error(
                        `[TimelineAnalyzer] Stack trace: ${processingError.stack}`
                    );
                }
                throw processingError;
            }
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

    private extractTopPerformingTopics(clusters: any[]): string[] {
        // Extract top performing topics based on engagement
        return clusters
            .sort(
                (a, b) =>
                    this.calculateTotalEngagement(b) -
                    this.calculateTotalEngagement(a)
            )
            .slice(0, 5)
            .map((c) => c.topic);
    }

    private calculateTotalEngagement(cluster: any): number {
        const eng = cluster.totalEngagement;
        return eng.likes + eng.retweets * 2 + eng.replies * 3 + eng.quotes * 2;
    }

    private extractSustainedDiscussions(clusters: any[]): string[] {
        // Extract topics with sustained engagement
        return clusters
            .filter((c) => c.duration > 3600000) // More than 1 hour
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
            .map((c) => c.topic);
    }

    private extractEmergingTrends(clusters: any[]): string[] {
        // Extract topics with high momentum
        return clusters
            .sort((a, b) => b.momentum - a.momentum)
            .slice(0, 5)
            .map((c) => c.topic);
    }
}
