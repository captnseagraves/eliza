import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.eventId,
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

    return NextResponse.json(event)
  } catch (error) {
    console.error("[EVENT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
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
    const { name, date, time, location, description, latitude, longitude } = body

    // Verify event ownership
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        hostId: user.id,
      },
    })

    if (!existingEvent) {
      return new NextResponse("Event not found", { status: 404 })
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        name,
        date: new Date(date),
        time,
        location,
        description,
        latitude,
        longitude,
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("[EVENT_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
