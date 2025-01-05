"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarDays, MapPin, Clock, Utensils } from "lucide-react"
import Image from "next/image"
import { VerificationModal } from "@/components/verification-modal"
import { ChatBox } from "@/components/chat/chat-box"
import { Map } from "@/components/ui/map"
import { formatEventTime } from "@/lib/utils"

interface Invitation {
  id: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  personalMessage: string
  event: {
    id: string
    name: string
    date: string
    time: string
    location: string
    description: string
    latitude: number | null
    longitude: number | null
  }
}

export default function InvitePage() {
  const params = useParams()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [pendingAction, setPendingAction] = useState<"ACCEPTED" | "DECLINED" | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/invite/${params.token}`)
      .then((res) => res.json())
      .then(setInvitation)
  }, [params.token])

  const handleActionClick = (action: "ACCEPTED" | "DECLINED") => {
    setPendingAction(action)
    setShowVerification(true)
  }

  const handleVerificationSuccess = async (phone: string) => {
    if (!pendingAction) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/invite/${params.token}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: pendingAction,
          phone,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invitation status")
      }

      const updatedInvitation = await response.json()
      setInvitation(updatedInvitation)
      setShowVerification(false)
      setPendingAction(null)
    } catch (err) {
      setError("Failed to update invitation status. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  const hasResponded = invitation.status !== "PENDING"
  const center = invitation.event.latitude && invitation.event.longitude
    ? { lat: invitation.event.latitude, lng: invitation.event.longitude }
    : { lat: 37.7749, lng: -122.4194 } // Default to San Francisco

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Dinewell"
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
                <p>{format(new Date(`2000-01-01T${invitation.event.time}`), "h:mm a")}</p>
              </div>
            </div>

            <div className="flex justify-center py-6">
              <div className="w-[95%]">
                <ChatBox 
                  eventId={invitation.event.id}
                  initialMessage={invitation.personalMessage}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Location</h2>
                </div>
                <p className="text-muted-foreground">{invitation.event.location}</p>
                {center && (
                  <Map
                    center={center}
                    zoom={15}
                    markers={[center]}
                    mapContainerStyle={{
                      width: "100%",
                      height: "300px",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                    }}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      streetViewControl: false,
                    }}
                  />
                )}
              </div>

              {invitation.event.description && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Details</h2>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {invitation.event.description}
                  </p>
                </div>
              )}
            </div>

            {!hasResponded && (
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => handleActionClick("DECLINED")}
                  variant="outline"
                  disabled={isLoading}
                >
                  Decline
                </Button>
                <Button
                  onClick={() => handleActionClick("ACCEPTED")}
                  disabled={isLoading}
                >
                  Accept
                </Button>
              </div>
            )}

            {error && (
              <p className="text-destructive text-center">{error}</p>
            )}
          </div>
        </Card>
      </div>

      <VerificationModal
        open={showVerification}
        onClose={() => {
          setShowVerification(false)
          setPendingAction(null)
        }}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  )
}
