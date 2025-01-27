import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { generateUserIdFromPhone } from "@/lib/user-id";
import { generateRoomId } from "@/lib/room-id";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, inviteToken } = await request.json();

    if (!phoneNumber || !code || !inviteToken) {
      return NextResponse.json(
        { error: "Phone number, code, and invitation token are required" },
        { status: 400 }
      );
    }

    // Normalize phone number to +1XXXXXXXXXX format for Twilio
    const normalizedPhone = phoneNumber.replace(/\D/g, "")
    if (!normalizedPhone.match(/^1?\d{10}$/)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }
    
    const twilioPhone = `+1${normalizedPhone.slice(-10)}`

    // Check if phone number matches invitation
    const invitation = await prisma.invitation.findUnique({
      where: {
        invitationToken: inviteToken,
      },
      include: {
        event: true, // Include event to get eventId
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    if (invitation.phoneNumber !== twilioPhone) {
      return NextResponse.json(
        { error: "Phone number does not match invitation" },
        { status: 403 }
      );
    }

    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({ to: twilioPhone, code });

    if (verification_check.status === "approved") {
      // Generate or retrieve agent user ID and room ID
      const agentUserId = invitation.agentUserId || generateUserIdFromPhone(twilioPhone);
      const agentRoomId = invitation.agentRoomId || generateRoomId(invitation.eventId, invitation.invitationToken);
      
      // Update invitation with agent IDs if not already set
      if (!invitation.agentUserId || !invitation.agentRoomId) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { 
            agentUserId,
            agentRoomId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        phoneNumber: twilioPhone,
        agentUserId,
        agentRoomId,
        eventDetails: {
          id: invitation.event.id,
          name: invitation.event.name,
          date: invitation.event.date,
          time: invitation.event.time,
          location: invitation.event.location,
          description: invitation.event.description,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
