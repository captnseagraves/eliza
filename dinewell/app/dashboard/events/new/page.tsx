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
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api"
import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

const mapContainerStyle = {
  width: "100%",
  height: "300px",
}

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
}

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

export default function NewEventPage() {
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  
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

  const router = useRouter()

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  async function onSubmit(data: EventFormValues) {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          latitude: markerPosition?.lat,
          longitude: markerPosition?.lng,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      const event = await response.json()
      router.push(`/dashboard/events/${event.id}`)
      router.refresh()
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
      setMarkerPosition({ lat, lng })
      
      mapRef.current?.panTo({ lat, lng })
      mapRef.current?.setZoom(15)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
          <p className="text-muted-foreground">
            Let me help you plan your perfect dinner gathering
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Fill in the basic details for your dinner event.
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
                        <Input placeholder="Dinner at my place" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your event a memorable name.
                      </FormDescription>
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
                      </FormControl>
                      <div className="rounded-md overflow-hidden border">
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={mapCenter}
                          zoom={13}
                          onLoad={onMapLoad}
                        >
                          {markerPosition && (
                            <Marker
                              position={markerPosition}
                            />
                          )}
                        </GoogleMap>
                      </div>
                      <FormDescription>
                        Search for a restaurant or address
                      </FormDescription>
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
                          placeholder="Tell your guests about the dinner..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the dinner, dress code, or anything else your guests should know.
                      </FormDescription>
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
