import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EventClient } from "./event-client"

async function getEvent(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      hostId: userId,
    },
    include: {
      invitations: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          invitations: true,
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  return event
}

export default async function EventPage({
  params: { eventId },
}: {
  params: { eventId: string }
}) {
  const user = await currentUser()
  if (!user) return null

  const event = await getEvent(eventId, user.id)

  return (
    <EventClient
      params={{ eventId }}
      event={{
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
        latitude: event.latitude,
        longitude: event.longitude,
        invitations: event.invitations,
        _count: event._count,
      }}
    >
      <button className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition">
        Send Invitation
      </button>
    </EventClient>
  )
}
