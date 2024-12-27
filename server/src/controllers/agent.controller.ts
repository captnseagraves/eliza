import { Request, Response } from "express";
import { logger } from "../config/logger";

export class AgentController {
    static async getAgents(req: Request, res: Response) {
        try {
            // For now, return a static list of agents
            const agents = [
                { id: "eliza", name: "Eliza" },
                { id: "therapist", name: "Therapist" },
                { id: "counselor", name: "Counselor" },
            ];

            res.json({ agents });
        } catch (error) {
            logger.error("Error in getAgents:", error);
            res.status(500).json({ error: "Failed to fetch agents" });
        }
    }

    static async getAgentById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // For now, return static agent data
            const agents = {
                eliza: {
                    id: "eliza",
                    name: "Eliza",
                    description: "The original AI therapist",
                },
                therapist: {
                    id: "therapist",
                    name: "Therapist",
                    description: "A modern AI therapist",
                },
                counselor: {
                    id: "counselor",
                    name: "Counselor",
                    description: "An AI counselor",
                },
            };

            const agent = agents[id as keyof typeof agents];

            if (!agent) {
                return res.status(404).json({ error: "Agent not found" });
            }

            res.json(agent);
        } catch (error) {
            logger.error("Error in getAgentById:", error);
            res.status(500).json({ error: "Failed to fetch agent" });
        }
    }
}
