"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Autocomplete } from "@react-google-maps/api"
import { Map } from "@/components/ui/map"

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "0.5rem",
}

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type EventFormValues = z.infer<typeof formSchema>

interface EventFormProps {
  eventId?: string
  defaultValues?: EventFormValues
  onSuccess?: () => void
}

export function EventForm({
  eventId,
  defaultValues,
  onSuccess,
}: EventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [mapCenter, setMapCenter] = useState(
    defaultValues?.latitude && defaultValues?.longitude
      ? { lat: defaultValues.latitude, lng: defaultValues.longitude }
      : defaultCenter
  )
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    defaultValues?.latitude && defaultValues?.longitude
      ? { lat: defaultValues.latitude, lng: defaultValues.longitude }
      : null
  )
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (data: EventFormValues) => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch(eventId ? `/api/events/${eventId}` : "/api/events", {
        method: eventId ? "PATCH" : "POST",
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
        throw new Error("Failed to save event")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        const event = await response.json()
        router.push(`/dashboard/events/${event.id}`)
      }
      
      router.refresh()
    } catch (error) {
      console.error("Error saving event:", error)
      setError("Failed to save event. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace()
    console.log("place", place)
    if (place?.formatted_address && place.geometry?.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      form.setValue("location", `${place.name} - ${place.formatted_address}`)
      form.setValue("latitude", lat)
      form.setValue("longitude", lng)

      setMapCenter({ lat, lng })
      setMarkerPosition({ lat, lng })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                >
                  <Input {...field} />
                </Autocomplete>
              </FormControl>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <Map
                  center={mapCenter}
                  zoom={15}
                  markers={markerPosition ? [markerPosition] : []}
                  mapContainerStyle={mapContainerStyle}
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : (eventId ? "Update Event" : "Create Event")}
        </Button>
      </form>
    </Form>
  )
}
