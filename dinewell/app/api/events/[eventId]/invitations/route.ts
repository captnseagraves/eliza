import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { sendInvitationSMS } from "@/lib/twilio"
import { nanoid } from 'nanoid'

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { eventId } = params
    const body = await req.json()
    const { phoneNumber, personalMessage } = body

    // Validate phone number
    const phoneRegex = /^\+1\d{10}$/
    if (!phoneRegex.test(phoneNumber)) {
      return new NextResponse("Invalid phone number format", { status: 400 })
    }

    // Check if event exists and belongs to user
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        hostId: user.id,
      },
    })

    if (!event) {
      return new NextResponse("Event not found", { status: 404 })
    }

    // Generate shorter invitation token
    const invitationToken = nanoid(10) // This will generate a 10-character token

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        eventId,
        phoneNumber,
        invitationToken,
        personalMessage,
      },
    })

    // Send SMS
    await sendInvitationSMS({
      to: phoneNumber,
      eventName: event.name,
      personalMessage,
      invitationToken,
    })

    return NextResponse.json({ token: invitationToken })
  } catch (error) {
    console.error("[INVITATIONS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { eventId } = params

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
    })

    if (!event) {
      return new NextResponse("Event not found", { status: 404 })
    }

    return NextResponse.json(event.invitations)
  } catch (error) {
    console.error("[INVITATIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
