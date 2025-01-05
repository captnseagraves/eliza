"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Map } from "@/components/ui/map"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

const eventFormSchema = z.object({
  name: z.string().min(2, {
    message: "Event name must be at least 2 characters.",
  }),
  date: z.string().min(1, {
    message: "Please select a date.",
  }),
  time: z.string().min(1, {
    message: "Please select a time.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
}

export default function NewEventPage() {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null)
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: "",
      description: "",
    },
  })

  const onSubmit = async (data: EventFormValues) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      const event = await response.json()
      router.push(`/dashboard/events/${event.id}`)
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const handleLocationSelect = (location: google.maps.LatLngLiteral) => {
    setSelectedLocation(location)
    // Use the Google Maps Geocoding service to get the address
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const address = results[0].formatted_address
        form.setValue("location", address)
        form.setValue("latitude", location.lat)
        form.setValue("longitude", location.lng)
      }
    })
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>
              Plan your next dinner event with friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dinner at Che Fico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter venue address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <label className="text-sm font-medium">Select Location on Map</label>
                  <Map
                    center={selectedLocation || defaultCenter}
                    markers={selectedLocation ? [selectedLocation] : []}
                    zoom={selectedLocation ? 15 : 12}
                    options={{
                      disableDefaultUI: false,
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: true,
                    }}
                    onClick={handleLocationSelect}
                    mapContainerStyle={{
                      width: "100%",
                      height: "300px",
                      borderRadius: "0.5rem",
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your guests about the event..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Create Event</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
