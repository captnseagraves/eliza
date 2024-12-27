import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  onLocationSelect?: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  className?: string;
}

export function LocationPicker({ onLocationSelect, className }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      libraries: ["places"],
    });

    loader.load().then(() => {
      if (inputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "us" },
            fields: ["formatted_address", "geometry"],
          }
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const newLocation = {
              address: place.formatted_address || "",
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setSelectedLocation(newLocation);
            setSearchValue(newLocation.address); // Update the input value
            onLocationSelect?.(newLocation);
          }
        });
      }
    });
  }, [onLocationSelect]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter location"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full"
        />
      </div>
      {selectedLocation && (
        <div className="h-[200px] w-full rounded-md overflow-hidden border">
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <Map
              zoom={15}
              center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              gestureHandling="greedy"
              mapId="location-picker"
            >
              <Marker
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              />
            </Map>
          </APIProvider>
        </div>
      )}
    </div>
  );
}
