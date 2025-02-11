import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendInvitationSMS } from "@/lib/twilio";
import { nanoid } from "nanoid";
import { generateUserIdFromPhone } from "@/lib/user-id";
import { generateInviteRoomId } from "@/lib/room-id";
import { format } from "date-fns";
import { formatEventTime } from "@/lib/utils";
import { getFirstAgentId } from "@/lib/agent";

export async function POST(
    req: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        console.log("[INVITATIONS_POST] Starting invitation creation");

        const user = await currentUser();
        if (!user) {
            console.log("[INVITATIONS_POST] No user found");
            return new NextResponse("Unauthorized", { status: 401 });
        }
        console.log("[INVITATIONS_POST] User authenticated:", user.id);

        const eventId = params.eventId;
        const body = await req.json();
        const { phoneNumber, personalMessage } = body;
        console.log("[INVITATIONS_POST] Request params:", {
            eventId,
            phoneNumber,
        });

        if (!phoneNumber || !personalMessage) {
            console.log("[INVITATIONS_POST] Missing required fields");
            return new NextResponse(
                "Phone number and personal message are required",
                { status: 400 }
            );
        }

        // Validate phone number
        const phoneRegex = /^\+1\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            console.log("[INVITATIONS_POST] Invalid phone number format");
            return new NextResponse("Invalid phone number format", {
                status: 400,
            });
        }

        // Check if event exists and belongs to user
        console.log("[INVITATIONS_POST] Fetching event");
        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                hostId: user.id,
            },
        });

        if (!event) {
            console.log("[INVITATIONS_POST] Event not found");
            return new NextResponse("Event not found", { status: 404 });
        }
        console.log("[INVITATIONS_POST] Event found:", event.id);

        // Generate invitation token and agent room ID
        const invitationToken = nanoid(10);
        const agentRoomId = generateInviteRoomId(eventId, invitationToken);
        console.log(" [INVITATIONS_POST] Generated IDs:", {
            eventId,
            invitationToken,
            agentRoomId,
        });

        // Generate agent user ID from phone number
        const agentUserId = generateUserIdFromPhone(phoneNumber);
        console.log("[INVITATIONS_POST] Generated agent user ID:", agentUserId);

        // Create invitation with all required fields
        console.log("[INVITATIONS_POST] Creating invitation");
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
        console.log("[INVITATIONS_POST] Invitation created:", invitation.id);

        // Format event details for the agent
        const eventDate = format(new Date(event.date), "EEEE, MMMM d, yyyy");
        const eventTime = formatEventTime(event.time);
        const eventContext = `You are assisting with an invitation to "${event.name}". The event will be held on ${eventDate} at ${eventTime}, located at ${event.location}. ${event.description ? `The host says: ${event.description}` : ""} The host's personal message is: "${personalMessage}". The eventId is ${event.id} and the invitation token is ${invitationToken}`;
        console.log("[INVITATIONS_POST] Event context prepared");

        // Send context to agent
        console.log("[INVITATIONS_POST] Getting agent ID");
        const agentId = await getFirstAgentId();
        console.log("[INVITATIONS_POST] Agent ID retrieved:", agentId);

        console.log("[INVITATIONS_POST] Sending context to agent");
        try {
            const contextResponse = await fetch(
                `http://localhost:8080/${agentId}/message`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: eventContext,
                        user: "Spirit of Dinner",
                        userId: agentId,
                        roomId: agentRoomId,
                        isSystem: true,
                        metadata: {
                            type: "event_context",
                            source: "invitation_creation",
                            eventId: params.eventId,
                        },
                    }),
                }
            );

            if (!contextResponse.ok) {
                const errorText = await contextResponse.text();
                console.error("[INVITATIONS_POST] Agent response not OK:", {
                    status: contextResponse.status,
                    statusText: contextResponse.statusText,
                    error: errorText,
                });
            } else {
                console.log(
                    "[INVITATIONS_POST] Context sent to agent successfully"
                );
            }
        } catch (error) {
            console.error(
                "[INVITATIONS_POST] Failed to send context to agent:",
                error
            );
        }

        try {
            const contextResponse = await fetch(
                `http://localhost:8080/${agentId}/message`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: personalMessage,
                        user: "Spirit of Dinner",
                        userId: agentId,
                        roomId: agentRoomId,
                        isSystem: true,
                        metadata: {
                            type: "invitation_message",
                            source: "invitation_creation",
                            eventId: params.eventId,
                        },
                    }),
                }
            );

            if (!contextResponse.ok) {
                const errorText = await contextResponse.text();
                console.error("[INVITATIONS_POST] Agent response not OK:", {
                    status: contextResponse.status,
                    statusText: contextResponse.statusText,
                    error: errorText,
                });
            } else {
                console.log(
                    "[INVITATIONS_POST] Context sent to agent successfully"
                );
            }
        } catch (error) {
            console.error(
                "[INVITATIONS_POST] Failed to send context to agent:",
                error
            );
        }

        // Send SMS
        console.log("[INVITATIONS_POST] Sending SMS");
        await sendInvitationSMS({
            to: phoneNumber,
            eventName: event.name,
            personalMessage,
            invitationToken,
        });
        console.log("[INVITATIONS_POST] SMS sent");

        console.log(
            "[INVITATIONS_POST] Invitation process completed successfully"
        );
        return NextResponse.json({ token: invitationToken });
    } catch (error) {
        console.error(
            "[INVITATIONS_POST] Error in invitation creation:",
            error instanceof Error ? error.message : "Unknown error",
            error
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

        const eventId = params.eventId;

        const invitations = await prisma.invitation.findMany({
            where: {
                eventId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(invitations);
    } catch (error) {
        console.error("[INVITATIONS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        const eventId = params.eventId;
        const body = await req.json();
        const { invitationToken, status } = body;

        console.log("[INVITATIONS_PUT] Updating invitation", {
            eventId,
            invitationToken,
            status,
        });

        if (!status || !invitationToken) {
            return new NextResponse(
                "Missing required fields (invitationToken and status are required)",
                { status: 400 }
            );
        }

        const invitation = await prisma.invitation.update({
            where: { invitationToken },
            data: {
                status,
                updatedAt: new Date(),
            },
        });

        console.log(
            "[INVITATIONS_PUT] Invitation updated successfully",
            invitation
        );
        return NextResponse.json(invitation);
    } catch (error) {
        console.error("[INVITATIONS_PUT] Error updating invitation:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
