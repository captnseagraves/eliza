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
import { Autocomplete } from "@react-google-maps/api"
import { useGoogleMaps } from "@/providers/google-maps-provider"

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
  const { isLoaded } = useGoogleMaps()
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  
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

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace()
    if (place?.formatted_address && place.geometry?.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      
      form.setValue("location", `${place.name} - ${place.formatted_address}`)
      form.setValue("latitude", lat)
      form.setValue("longitude", lng)
      
      setMapCenter({ lat, lng })
      setSelectedLocation({ lat, lng })
    }
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
                    <FormItem className="space-y-4">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(autocomplete) => {
                              autocompleteRef.current = autocomplete
                            }}
                            onPlaceChanged={handlePlaceSelect}
                            options={{ types: ["establishment", "geocode"] }}
                          >
                            <Input
                              placeholder="Search for a location..."
                              {...field}
                            />
                          </Autocomplete>
                        ) : (
                          <Input
                            placeholder="Loading location search..."
                            disabled
                            {...field}
                          />
                        )}
                      </FormControl>
                      <div className="rounded-md overflow-hidden border">
                        <Map
                          center={mapCenter}
                          zoom={15}
                          markers={selectedLocation ? [selectedLocation] : []}
                          mapContainerStyle={{
                            width: "100%",
                            height: "300px",
                          }}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
