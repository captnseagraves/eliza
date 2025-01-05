"use client"

import { GoogleMap, Marker, GoogleMapProps } from "@react-google-maps/api"
import { useGoogleMaps } from "@/providers/google-maps-provider"

interface MapProps extends Omit<GoogleMapProps, "onLoad" | "onUnmount"> {
  markers?: google.maps.LatLngLiteral[]
}

export function Map({ markers = [], ...props }: MapProps) {
  const { isLoaded, loadError } = useGoogleMaps()

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg">
        <p className="text-muted-foreground">Failed to load map</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <GoogleMap {...props}>
      {markers.map((position, index) => (
        <Marker key={index} position={position} />
      ))}
    </GoogleMap>
  )
}
