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
  params,
}: {
  params: { eventId: string }
}) {
  const user = await currentUser()
  if (!user) return null

  const event = await getEvent(params.eventId, user.id)

  return (
    <EventClient
      params={params}
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
    />
  )
}
