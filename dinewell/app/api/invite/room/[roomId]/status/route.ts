import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    console.log(" [RSVP Status API] Starting GET request handler", {
        timestamp: new Date().toISOString(),
        roomId: params.roomId,
    });

    try {
        // Get roomId from params
        const roomId = params.roomId;
        console.log(" [RSVP Status API] Processing roomId:", roomId);

        // Find invitation by roomId
        const invitation = await prisma.invitation.findFirst({
            where: {
                agentRoomId: roomId,
            },
            select: {
                status: true,
            },
        });

        if (!invitation) {
            console.error(
                " [RSVP Status API] No invitation found for roomId:",
                roomId
            );
            return new NextResponse("Invitation not found", { status: 404 });
        }

        console.log(
            " [RSVP Status API] Found invitation status:",
            invitation.status
        );

        // Return the status
        return NextResponse.json({
            status: invitation.status,
        });
    } catch (error) {
        console.error(" [RSVP Status API] Error processing request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
