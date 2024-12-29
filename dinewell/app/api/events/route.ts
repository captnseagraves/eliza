import { NextResponse } from "next/server"
import { Request } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const events = await prisma.event.findMany({
      where: {
        hostId: user.id,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        _count: {
          select: {
            invitations: true,
          },
        },
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, date, time, location, description, latitude, longitude } = body

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        time,
        location,
        description,
        latitude,
        longitude,
        hostId: user.id,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("[EVENTS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
