import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: "Phone number and code are required" },
        { status: 400 }
      );
    }

    // Normalize phone number to +1XXXXXXXXXX format for Twilio
    const normalizedPhone = phoneNumber.replace(/\D/g, "")
    if (!normalizedPhone.match(/^1?\d{10}$/)) {
      return new NextResponse("Invalid phone number format", { status: 400 })
    }
    
    const twilioPhone = `+1${normalizedPhone.slice(-10)}`

    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({ to: twilioPhone, code });

    if (verification_check.status === "approved") {
      return NextResponse.json({ status: "approved" });
    } else {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error checking verification:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
