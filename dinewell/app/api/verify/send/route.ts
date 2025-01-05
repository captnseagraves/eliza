import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone number to +1XXXXXXXXXX format for Twilio
    const normalizedPhone = phoneNumber.replace(/\D/g, "")
    if (!normalizedPhone.match(/^1?\d{10}$/)) {
      return new NextResponse("Invalid phone number format", { status: 400 })
    }
    
    const twilioPhone = `+1${normalizedPhone.slice(-10)}`

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
