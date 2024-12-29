import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EventPage from "./page"

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

export default async function EventPageServer({
  params,
}: {
  params: { eventId: string }
}) {
  const user = await currentUser()
  if (!user) return null

  const event = await getEvent(params.eventId, user.id)

  return <EventPage params={params} event={event} />
}
