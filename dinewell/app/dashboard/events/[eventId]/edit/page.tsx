import { currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import { EventForm } from "@/components/forms/event-form"

async function getEvent(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      hostId: userId,
    },
  })

  if (!event) {
    notFound()
  }

  return event
}

export default async function EditEventPage({
  params,
}: {
  params: { eventId: string }
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const event = await getEvent(params.eventId, user.id)

  // Format the date to match the form's expected format (YYYY-MM-DD)
  const formattedDate = format(event.date, "yyyy-MM-dd")

  const defaultValues = {
    name: event.name,
    date: formattedDate,
    time: event.time,
    location: event.location,
    description: event.description || "",
    latitude: event.latitude,
    longitude: event.longitude,
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Edit Event</h1>
        <p className="text-gray-500">Update your event details</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <EventForm 
          eventId={params.eventId}
          defaultValues={defaultValues}
          submitButtonText="Update Event"
        />
      </Card>
    </div>
  )
}
