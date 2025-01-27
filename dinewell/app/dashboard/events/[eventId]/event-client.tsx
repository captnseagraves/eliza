"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InvitationForm } from "@/components/forms/invitation-form"
import { InvitationList } from "@/components/invitation-list"
import { EventForm } from "@/components/forms/event-form"
import { MapPinIcon, CalendarIcon, ClockIcon, UsersIcon, PencilIcon } from "lucide-react"
import { Map } from "@/components/ui/map"

interface EventPageProps {
  params: { eventId: string }
  event: {
    id: string
    name: string
    date: Date
    time: string
    location: string
    description: string | null
    latitude: number | null
    longitude: number | null
    invitations: any[]
    _count: {
      invitations: number
    }
  }
}

export function EventClient({ params, event }: EventPageProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
          <p className="text-gray-500">Event Details</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event Information</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 w-8"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <EventForm
                  eventId={event.id}
                  defaultValues={{
                    name: event.name,
                    date: format(new Date(event.date), "yyyy-MM-dd"),
                    time: event.time,
                    location: event.location,
                    description: event.description || "",
                    latitude: event.latitude || undefined,
                    longitude: event.longitude || undefined,
                  }}
                  onSuccess={() => setIsEditing(false)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <span>{format(new Date(event.date), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-gray-500" />
                    <span>{format(new Date(`2000-01-01T${event.time}`), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                  {event.latitude && event.longitude && (
                    <Map
                      center={{ lat: event.latitude, lng: event.longitude }}
                      zoom={15}
                      markers={[{ lat: event.latitude, lng: event.longitude }]}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                      }}
                      mapContainerStyle={{
                        width: "100%",
                        height: "300px",
                        borderRadius: "0.5rem",
                        marginTop: "1rem",
                      }}
                    />
                  )}
                  {event.description && (
                    <div className="mt-4">
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationForm eventId={event.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Guest List</CardTitle>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {event._count.invitations} sent
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InvitationList invitations={event.invitations} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
