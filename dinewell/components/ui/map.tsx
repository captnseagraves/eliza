"use client"

import { useLoadScript, GoogleMap, Marker, GoogleMapProps } from "@react-google-maps/api"

interface MapProps extends Omit<GoogleMapProps, "onLoad" | "onUnmount"> {
  markers?: { lat: number; lng: number }[]
}

// Create a singleton for the script loader
let scriptPromise: Promise<void> | null = null

export function Map({ markers = [], ...props }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    // This ensures the script is only loaded once
    preventGoogleFontsLoading: true,
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-muted animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <GoogleMap {...props}>
      {markers.map((position, idx) => (
        <Marker key={`${position.lat}-${position.lng}-${idx}`} position={position} />
      ))}
    </GoogleMap>
  )
}
