import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
    params: {
        roomId: string;
    };
}

export async function POST(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    console.log(" [RSVP Room API] Starting POST request handler", {
        timestamp: new Date().toISOString(),
        roomId: params.roomId,
    });

    try {
        // Get roomId from params
        const roomId = params.roomId;
        console.log(" [RSVP Room API] Processing roomId:", roomId);

        // Parse body
        const body = await request.json();
        console.log(" [RSVP Room API] Request body:", body);
        const { status } = body;

        // Validate input
        if (!status) {
            console.error(" [RSVP Room API] Missing status in request");
            return new NextResponse("Missing status", { status: 400 });
        }

        // Find invitation by roomId
        const invitation = await prisma.invitation.findFirst({
            where: {
                agentRoomId: roomId,
            },
            include: {
                event: true,
            },
        });

        if (!invitation) {
            console.error(
                " [RSVP Room API] No invitation found for roomId:",
                roomId
            );
            return new NextResponse("Invitation not found", { status: 404 });
        }

        // Update invitation status
        const updatedInvitation = await prisma.invitation.update({
            where: {
                id: invitation.id,
            },
            data: {
                status: status.toUpperCase(),
                respondedAt: new Date(),
            },
            include: {
                event: true,
            },
        });

        console.log(" [RSVP Room API] Successfully updated invitation:", {
            id: updatedInvitation.id,
            status: updatedInvitation.status,
            respondedAt: updatedInvitation.respondedAt,
        });

        return NextResponse.json({
            success: true,
            invitation: {
                id: updatedInvitation.id,
                status: updatedInvitation.status,
                eventName: updatedInvitation.event.name,
                eventDate: updatedInvitation.event.date,
                eventTime: updatedInvitation.event.time,
                eventLocation: updatedInvitation.event.location,
            },
        });
    } catch (error) {
        console.error(" [RSVP Room API] Error processing request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;

        const rsvp = await prisma.rsvp.findFirst({
            where: {
                roomId: roomId,
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                status: true
            }
        });

        return NextResponse.json({ status: rsvp?.status || undefined });
    } catch (error) {
        console.error('Error fetching RSVP status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch RSVP status' },
            { status: 500 }
        );
    }
}
