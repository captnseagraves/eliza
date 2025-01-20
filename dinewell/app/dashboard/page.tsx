"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, isPast } from "date-fns"

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  _count?: {
    invitations: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then(setEvents)
  }, [])

  const upcomingEvents = events.filter(
    (event) => !isPast(new Date(event.date))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastEvents = events.filter(
    (event) => isPast(new Date(event.date))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const EventList = ({ events }: { events: Event[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {format(new Date(event.date), "MMMM d, yyyy")} at {format(new Date(`1970-01-01T${event.time}`), "h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
              {event._count && (
                <div>
                  <p className="text-sm font-medium">Guests</p>
                  <p className="text-sm text-muted-foreground">
                    {event._count.invitations} invited
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <Link href={`/dashboard/events/${event.id}`}>
                  <Button className="bg-rose-600 text-white hover:bg-rose-700 transition">View Event</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>No Events</CardTitle>
            <CardDescription>
              {upcomingEvents.length === 0
                ? "Create your first event to get started"
                : "No events found in this category"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
            <p className="text-muted-foreground">
              Manage your dinner events and invitations
            </p>
          </div>
          <Button className="bg-rose-600 text-white hover:bg-rose-700 transition" onClick={() => router.push("/dashboard/events/new")}>
            Create New Event
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            <EventList events={upcomingEvents} />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <EventList events={pastEvents} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
