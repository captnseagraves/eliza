import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, inviteToken } = await request.json();

    if (!phoneNumber || !inviteToken) {
      return NextResponse.json(
        { error: "Phone number and invitation token are required" },
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

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verifications.create({ to: twilioPhone, channel: "sms" });

    return NextResponse.json({ status: verification.status });
  } catch (error) {
    console.error("Error sending verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
