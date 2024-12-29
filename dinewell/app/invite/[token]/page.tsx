"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api"
import { CalendarDays, MapPin, Clock, Utensils } from "lucide-react"
import Image from "next/image"
import { VerificationModal } from "@/components/verification-modal"

interface Invitation {
  id: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  personalMessage: string
  event: {
    name: string
    date: string
    time: string
    location: string
    description: string
    latitude: number | null
    longitude: number | null
  }
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
}

export default function InvitePage() {
  const params = useParams()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [pendingAction, setPendingAction] = useState<"ACCEPTED" | "DECLINED" | null>(null)
  const [error, setError] = useState("")

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  useEffect(() => {
    fetch(`/api/invite/${params.token}`)
      .then((res) => res.json())
      .then(setInvitation)
  }, [params.token])

  const handleActionClick = (action: "ACCEPTED" | "DECLINED") => {
    setPendingAction(action)
    setShowVerification(true)
  }

  const handleVerified = async (phoneNumber: string) => {
    if (!pendingAction) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/invite/${params.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingAction, phoneNumber }),
      })

      if (!response.ok) {
        throw new Error("Failed to update response")
      }

      const updatedInvitation = await response.json()
      setInvitation(updatedInvitation)
      setShowVerification(false)
      setPendingAction(null)
    } catch (error) {
      console.error("Error updating response:", error)
      setError("Failed to update response")
    } finally {
      setIsLoading(false)
    }
  }

  if (!invitation || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-2xl text-muted-foreground">
          Preparing your invitation...
        </div>
      </div>
    )
  }

  const center = invitation.event.latitude && invitation.event.longitude
    ? { lat: invitation.event.latitude, lng: invitation.event.longitude }
    : { lat: 37.7749, lng: -122.4194 }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-2xl py-10 px-4">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Mister Dinewell"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h2 className="text-lg font-medium text-muted-foreground">
            Mister Dinewell Presents
          </h2>
        </div>

        <Card className="p-8 shadow-lg border-2">
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {invitation.event.name}
              </h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <p>{format(new Date(invitation.event.date), "MMMM d, yyyy")}</p>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <p>{invitation.event.time}</p>
              </div>
            </div>

            {invitation.personalMessage && (
              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-lg italic text-muted-foreground whitespace-pre-wrap">
                    {invitation.personalMessage.replace(/\\n\\n/g, '\n\n')}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Location</h2>
                </div>
                <p className="text-muted-foreground">{invitation.event.location}</p>
                <div className="rounded-xl overflow-hidden border shadow-md">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                  >
                    <Marker position={center} />
                  </GoogleMap>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Details</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {invitation.event.description}
                </p>
              </div>
            </div>

            {invitation.status === "PENDING" ? (
              <div className="space-y-4">
                <div className="h-px bg-border" />
                {error && (
                  <div className="text-sm text-destructive text-center">
                    {error}
                  </div>
                )}
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleActionClick("ACCEPTED")}
                    disabled={isLoading}
                    size="lg"
                    className="w-32 bg-primary hover:bg-primary/90"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleActionClick("DECLINED")}
                    variant="outline"
                    disabled={isLoading}
                    size="lg"
                    className="w-32"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="h-px bg-border" />
                <p className="text-lg font-medium text-primary">
                  You have {invitation.status.toLowerCase()} this invitation
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      <VerificationModal
        isOpen={showVerification}
        onClose={() => {
          setShowVerification(false)
          setPendingAction(null)
        }}
        onVerified={handleVerified}
        intentAction={pendingAction || "ACCEPTED"}
      />
    </div>
  )
}
