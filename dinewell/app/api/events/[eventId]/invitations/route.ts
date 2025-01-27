import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendInvitationSMS } from "@/lib/twilio";
import { nanoid } from "nanoid";
import { generateUserIdFromPhone } from "@/lib/user-id";
import { generateInviteRoomId } from "@/lib/room-id";

export async function POST(
    req: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const eventId = await params.eventId;
        const body = await req.json();
        const { phoneNumber, personalMessage } = body;

        if (!phoneNumber || !personalMessage) {
            return new NextResponse(
                "Phone number and personal message are required",
                { status: 400 }
            );
        }

        // Validate phone number
        const phoneRegex = /^\+1\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return new NextResponse("Invalid phone number format", {
                status: 400,
            });
        }

        // Check if event exists and belongs to user
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                hostId: user.id,
            },
        });

        if (!event) {
            return new NextResponse("Event not found", { status: 404 });
        }

        // Generate shorter invitation token
        const invitationToken = nanoid(10); // This will generate a 10-character token

        // Generate agent user ID from phone number
        const agentUserId = generateUserIdFromPhone(phoneNumber);

        // Generate agent room ID from event and invitation
        const agentRoomId = generateInviteRoomId(eventId, invitationToken);

        // Create invitation with all required fields
        const invitation = await prisma.invitation.create({
            data: {
                eventId,
                phoneNumber,
                invitationToken,
                personalMessage,
                status: "PENDING",
                agentUserId,
                agentRoomId,
            },
        });

        // Send SMS
        await sendInvitationSMS({
            to: phoneNumber,
            eventName: event.name,
            personalMessage,
            invitationToken,
        });

        return NextResponse.json({ token: invitationToken });
    } catch (error) {
        console.error(
            "[INVITATIONS_POST]",
            error instanceof Error ? error.message : "Unknown error"
        );
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const eventId = await params.eventId;

        // Check if event exists and belongs to user
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                hostId: user.id,
            },
            include: {
                invitations: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!event) {
            return new NextResponse("Event not found", { status: 404 });
        }

        return NextResponse.json(event.invitations);
    } catch (error) {
        console.error(
            "[INVITATIONS_GET]",
            error instanceof Error ? error.message : "Unknown error"
        );
        return new NextResponse("Internal error", { status: 500 });
    }
}
