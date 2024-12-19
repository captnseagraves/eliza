import { elizaLogger } from "@ai16z/eliza";
import { Tweet } from "agent-twitter-client";
import { TimelineAnalysis, ANALYSIS_WEIGHTS } from "./timeline-analyzer";
import { TopicHistoryManager } from "./topic-history";

export interface TopicSuggestion {
    topic: string;
    confidence: number;
    contextualInfo: {
        relatedTopics: string[];
        supportingTweets: Tweet[];
        timelineContext: string;
    };
}

export class TopicGenerator {
    private topicHistory: TopicHistoryManager;

    constructor(
        private allowedTopics: string[],
        storageDir: string = "./data"
    ) {
        this.topicHistory = new TopicHistoryManager(storageDir);
    }

    public async generateTopic(analysis: TimelineAnalysis): Promise<TopicSuggestion> {
        try {
            elizaLogger.info("Starting topic generation from timeline analysis");

            // Score and sort topics
            const scoredTopics = this.scoreTopics(analysis);
            
            // Find first allowed topic
            let selectedTopic: string | null = null;
            for (const [topic, score] of scoredTopics) {
                if (this.topicHistory.isTopicAllowed(topic)) {
                    selectedTopic = topic;
                    break;
                }
                elizaLogger.log(`Topic ${topic} skipped due to recent use`);
            }

            if (!selectedTopic) {
                // Fallback to least recently used topic
                selectedTopic = scoredTopics[0][0];
                elizaLogger.log("Using fallback topic selection");
            }

            const relatedTopics = this.findRelatedTopics(selectedTopic, analysis);
            const supportingTweets = this.findSupportingTweets(selectedTopic, analysis);
            const timelineContext = this.generateContext(selectedTopic, analysis);

            const suggestion: TopicSuggestion = {
                topic: selectedTopic,
                confidence: scoredTopics.find(([topic]) => topic === selectedTopic)?.[1] ?? 0,
                contextualInfo: {
                    relatedTopics,
                    supportingTweets,
                    timelineContext,
                },
            };

            elizaLogger.log(`Generated topic suggestion: ${suggestion.topic} (confidence: ${suggestion.confidence})`);
            return suggestion;

        } catch (error) {
            elizaLogger.error("Error generating topic:", error);
            throw error;
        }
    }

    private scoreTopics(analysis: TimelineAnalysis) {
        const topics = new Map<string, {
            topic: string;
            score: number;
            engagement: number;
            recency: number;
            clusterStrength: number;
        }>();

        // Score based on individual tweets
        analysis.individual.forEach(tweet => {
            const tweetTopics = analysis.clusters
                .filter(c => c.tweets.includes(tweet.tweetId))
                .map(c => c.topic);

            tweetTopics.forEach(topic => {
                if (!topics.has(topic)) {
                    topics.set(topic, {
                        topic,
                        score: 0,
                        engagement: 0,
                        recency: 0,
                        clusterStrength: 0
                    });
                }

                const topicData = topics.get(topic)!;
                topicData.engagement += this.calculateEngagementScore(tweet.engagement);
            });
        });

        // Score based on clusters
        analysis.clusters.forEach(cluster => {
            const topic = cluster.topic;
            if (!topics.has(topic)) {
                topics.set(topic, {
                    topic,
                    score: 0,
                    engagement: 0,
                    recency: 0,
                    clusterStrength: 0
                });
            }

            const topicData = topics.get(topic)!;
            topicData.clusterStrength += cluster.momentum;
            topicData.recency = Math.max(topicData.recency, cluster.duration);
        });

        // Calculate final scores
        return Array.from(topics.values())
            .map(topicData => ({
                ...topicData,
                score: this.calculateFinalScore(topicData)
            }))
            .sort((a, b) => b.score - a.score)
            .map(topic => [topic.topic, topic.score]);
    }

    private calculateEngagementScore(engagement: any): number {
        return (
            engagement.likes +
            engagement.retweets * 2 +
            engagement.replies * 3 +
            engagement.quotes * 2
        );
    }

    private calculateFinalScore(topicData: any): number {
        return (
            topicData.engagement * ANALYSIS_WEIGHTS.engagement +
            topicData.recency * ANALYSIS_WEIGHTS.recency +
            topicData.clusterStrength * ANALYSIS_WEIGHTS.clusterRelevance
        );
    }

    private findRelatedTopics(topic: string, analysis: TimelineAnalysis): string[] {
        // Find topics that frequently appear in the same clusters
        const relatedTopics = new Map<string, number>();

        analysis.clusters.forEach(cluster => {
            if (cluster.topic === topic) {
                analysis.clusters.forEach(otherCluster => {
                    if (otherCluster.topic !== topic) {
                        const commonTweets = cluster.tweets.filter(t => 
                            otherCluster.tweets.includes(t)
                        ).length;
                        
                        if (commonTweets > 0) {
                            relatedTopics.set(
                                otherCluster.topic,
                                (relatedTopics.get(otherCluster.topic) || 0) + commonTweets
                            );
                        }
                    }
                });
            }
        });

        return Array.from(relatedTopics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);
    }

    private generateContext(topic: string, analysis: TimelineAnalysis): string {
        const relevantClusters = analysis.clusters
            .filter(c => c.topic === topic)
            .sort((a, b) => b.momentum - a.momentum);

        if (relevantClusters.length === 0) {
            return "General discussion";
        }

        const mainCluster = relevantClusters[0];
        return `Ongoing discussion with ${mainCluster.totalEngagement.participantCount} participants`;
    }

    private findSupportingTweets(topic: string, analysis: TimelineAnalysis): Tweet[] {
        // Find tweets from clusters with this topic
        const relevantTweetIds = new Set(
            analysis.clusters
                .filter(c => c.topic === topic)
                .flatMap(c => c.tweets)
        );

        return Array.from(relevantTweetIds).slice(0, 5) as unknown as Tweet[];
    }
}
