import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializeAgentRoom } from "@/lib/agent";
import { validateRoomAccess } from "@/lib/room-id";

if (!process.env.AGENT_ENDPOINT) {
    throw new Error("AGENT_ENDPOINT environment variable is not set");
}

export async function POST(request: NextRequest) {
    try {
        const { invitationToken, agentRoomId, agentUserId } = await request.json();

        if (!invitationToken || !agentRoomId || !agentUserId) {
            return NextResponse.json(
                { error: "Invitation token, room ID, and user ID are required" },
                { status: 400 }
            );
        }

        // Get invitation with event details
        const invitation = await prisma.invitation.findUnique({
            where: {
                invitationToken,
            },
            include: {
                event: true,
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: "Invalid invitation token" },
                { status: 404 }
            );
        }

        // Validate room access
        if (!validateRoomAccess(agentRoomId, invitation.eventId, invitationToken)) {
            return NextResponse.json(
                { error: "Invalid room access" },
                { status: 403 }
            );
        }

        // Initialize agent chat room with event context
        await initializeAgentRoom(
            agentRoomId,
            agentUserId,
            invitation.event
        );

        return NextResponse.json({
            success: true,
            message: "Chat room initialized successfully",
        });
    } catch (error) {
        console.error("Error initializing chat room:", error);
        return NextResponse.json(
            { error: "Failed to initialize chat room" },
            { status: 500 }
        );
    }
}
