"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { format, addHours, parseISO } from "date-fns"
import { CalendarDays, MapPin, Clock, Utensils, Twitter, Calendar, Map as MapIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { VerificationModal } from "@/components/verification-modal"
import { ChatBox } from "@/components/chat/chat-box"
import { Map } from "@/components/ui/map"
import { formatEventTime } from "@/lib/utils"
import { AddToCalendarButton } from 'add-to-calendar-button-react'
import Cookies from 'js-cookie'

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

const CONTRACT_ADDRESS = "0xc4ecaf115cbce3985748c58dccfc4722fef8247c"
const DEX_SCREENER_URL = `https://dexscreener.com/base/${CONTRACT_ADDRESS}`

export default function InvitePage() {
  const params = useParams()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Check for existing verification
    const token = params.token as string
    const verifiedPhoneNumber = Cookies.get(`verified_invite_${token}`)

    if (verifiedPhoneNumber) {
      setIsVerified(true)
      setVerifiedPhone(verifiedPhoneNumber)
    }

    // Fetch invitation data
    fetch(`/api/invite/${token}`)
      .then((res) => res.json())
      .then(setInvitation)
  }, [params.token])

  const handleVerificationSuccess = async (data: { phoneNumber: string }) => {
    setVerifiedPhone(data.phoneNumber)
    setIsVerified(true)
  }

  const handleRsvp = async (status: "ACCEPTED" | "DECLINED") => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/invite/${params.token}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          phone: verifiedPhone,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invitation status")
      }

      const updatedInvitation = await response.json()
      setInvitation(updatedInvitation)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white border-b z-[100] pointer-events-auto">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="text-lg font-medium">
            dinner.fun
          </Link>
          <a
            href="https://dexscreener.com/base/0xc4ecaf115cbce3985748c58dccfc4722fef8247c"
            className="text-sm text-muted-foreground hover:text-rose-600 transition-colors hidden md:block"
            target="_blank"
            rel="noopener noreferrer"
          >
            $DINNER - {CONTRACT_ADDRESS}
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="https://x.com/misterdinewell"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href={DEX_SCREENER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/dexscreener.png"
                alt="Dexscreener"
                width={20}
                height={20}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {invitation && (
              <>
                <div className="space-y-8">
                  <div>
                    <ChatBox
                      eventId={invitation.event.id}
                      initialMessage={invitation.personalMessage}
                    />
                  </div>

                  {/* Initial State: Only RSVP Buttons */}
                  {!hasResponded && (
                    <div className="flex gap-4 justify-center">
                      <Button
                        className="w-32 bg-rose-600 hover:bg-rose-700"
                        onClick={() => handleRsvp("ACCEPTED")}
                        disabled={!isVerified}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="w-32"
                        onClick={() => handleRsvp("DECLINED")}
                        disabled={!isVerified}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {/* Post-RSVP States */}
                  {invitation.status === "ACCEPTED" && (
                    <div className="space-y-6">
                      <p className="text-center text-green-600 font-medium">
                        You're going to dinner!<br />
                        Feel free to ask me any questions before the gathering.
                      </p>

                      <div className="flex justify-center gap-4">
                        <AddToCalendarButton
                          name={invitation.event.name}
                          description={invitation.event.description || "Join us for dinner!"}
                          startDate={format(new Date(invitation.event.date), 'yyyy-MM-dd')}
                          startTime={format(parseISO(`2000-01-01T${invitation.event.time}`), 'HH:mm')}
                          endTime={format(addHours(parseISO(`2000-01-01T${invitation.event.time}`), 2), 'HH:mm')}
                          location={invitation.event.location}
                          options={['Google']}
                          styleLight="--btn-background: #e11d48; --btn-text: #fff;"
                          label="Add to Calendar"
                        />
                        <button
                          className="location-button"
                          onClick={() => {
                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.event.location)}`;
                            window.open(mapUrl, '_blank');
                          }}
                        >
                          <MapIcon className="h-4 w-4" />
                          Location
                        </button>
                      </div>
                    </div>
                  )}

                  {invitation.status === "DECLINED" && (
                    <p className="text-center text-muted-foreground">
                      We'll miss you!<br />
                      May your evening be filled with delightful company wherever you dine.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!isVerified && (
          <VerificationModal
            open={true}
            onClose={() => {}} // Cannot be closed
            onSuccess={handleVerificationSuccess}
            inviteToken={params.token as string}
          />
        )}
      </main>
    </div>
  )
}

function addHours(date: Date, hours: number) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}
