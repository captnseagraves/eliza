import { elizaLogger } from "@ai16z/eliza";
import { Tweet } from "agent-twitter-client";
import { TimelineAnalysis } from "./timeline-analyzer";
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

    public async generateTopic(
        timelineContext: { 
            clusters: { topic: string, engagementRate: number, participantCount: number, engagement: any }[],
            timelineContext: string 
        }
    ): Promise<TopicSuggestion> {
        try {
            elizaLogger.info("Starting topic generation from timeline analysis");

            // Get the cluster with highest engagement
            const cluster = timelineContext.clusters[0]; // Already sorted by engagement
            
            if (!cluster) {
                throw new Error("No valid clusters found for topic generation");
            }

            return {
                topic: cluster.topic,
                confidence: 1.0, // High confidence since based on actual engagement
                contextualInfo: {
                    relatedTopics: [],
                    supportingTweets: [],
                    timelineContext: timelineContext.timelineContext,
                },
            };

        } catch (error) {
            elizaLogger.error("Error generating topic:", error);
            throw error;
        }
    }
}
