import { elizaLogger } from "@ai16z/eliza";
import * as fs from "fs";
import * as path from "path";

export interface TopicHistoryEntry {
    topic: string;
    timestamp: Date;
    tweetId: string;
}

export class TopicHistoryManager {
    private history: TopicHistoryEntry[] = [];
    private readonly maxHistory: number = 10;
    private readonly cooldownPeriod: number = 5;
    private readonly storageFile: string;

    constructor(storageDir: string) {
        this.storageFile = path.join(storageDir, "topic-history.json");
        this.loadHistory();
    }

    private loadHistory(): void {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, "utf-8");
                this.history = JSON.parse(data).map((entry: any) => ({
                    ...entry,
                    timestamp: new Date(entry.timestamp),
                }));
                elizaLogger.log(`[TopicHistory] Loaded ${this.history.length} entries from storage`);
            }
        } catch (error) {
            elizaLogger.error(`[TopicHistory] Error loading history: ${error}`);
            this.history = [];
        }
    }

    private saveHistory(): void {
        try {
            const dir = path.dirname(this.storageFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.storageFile, JSON.stringify(this.history, null, 2));
            elizaLogger.log("[TopicHistory] History saved successfully");
        } catch (error) {
            elizaLogger.error(`[TopicHistory] Error saving history: ${error}`);
        }
    }

    public addTopic(topic: string, tweetId: string): void {
        this.history.unshift({
            topic,
            timestamp: new Date(),
            tweetId,
        });

        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        this.saveHistory();
        elizaLogger.log(`[TopicHistory] Added topic: ${topic}`);
    }

    public isTopicAllowed(topic: string): boolean {
        const recentTopics = this.history.slice(0, this.cooldownPeriod);
        const isRecent = recentTopics.some(entry => 
            entry.topic.toLowerCase() === topic.toLowerCase()
        );

        if (isRecent) {
            elizaLogger.log(`[TopicHistory] Topic '${topic}' is too recent`);
            return false;
        }

        return true;
    }

    public getRecentTopics(): TopicHistoryEntry[] {
        return [...this.history];
    }
}
