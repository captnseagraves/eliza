"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { format, addHours, parseISO } from "date-fns"
import { CalendarDays, MapPin, Clock, Utensils, Twitter, Calendar, Map as MapIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Cookies from "js-cookie"
import { VerificationModal } from "@/components/verification-modal"
import { ChatBox, ChatBoxRef } from "@/components/chat/chat-box"
import { Map } from "@/components/ui/map"
import { formatEventTime } from "@/lib/utils"
import { AddToCalendarButton } from 'add-to-calendar-button-react'

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
  const token = params?.token as string
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRsvpLoading, setIsRsvpLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [error, setError] = useState("")
  const chatRef = useRef<ChatBoxRef>(null)

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/invite/${token}`)

        if (!response.ok) {
          throw new Error("Failed to fetch invitation")
        }

        const data = await response.json()
        setInvitation(data)
      } catch (error) {
        console.error("Error fetching invitation:", error)
        setError("Failed to load invitation")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  useEffect(() => {
    if (!token) return;

    // Check for existing verification
    const verifiedPhoneNumber = Cookies.get(`verified_invite_${token}`)

    if (verifiedPhoneNumber) {
      setIsVerified(true)
      setVerifiedPhone(verifiedPhoneNumber)
    }
  }, [token])

  const handleVerificationSuccess = async (data: { phoneNumber: string }) => {
    setVerifiedPhone(data.phoneNumber)
    setIsVerified(true)
  }

  const handleRSVP = async (status: "ACCEPTED" | "DECLINED") => {
    if (!verifiedPhone) {
      setError("Please verify your phone number first")
      return
    }

    setError("")
    setIsRsvpLoading(true)

    try {
      const response = await fetch(`/api/invite/${token}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          phoneNumber: verifiedPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update RSVP")
      }

      setInvitation(data)
    } catch (error) {
      console.error("Error updating RSVP:", error)
      setError(error instanceof Error ? error.message : "Failed to update RSVP")
    } finally {
      setIsRsvpLoading(false)
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
            {CONTRACT_ADDRESS}
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
                      ref={chatRef}
                      eventId={invitation.event.id}
                      initialMessage={invitation.personalMessage}
                    />
                  </div>

                  {/* Initial State: Only RSVP Buttons */}
                  {!hasResponded && (
                    <div className="flex gap-4 justify-center">
                      <Button
                        className="w-32 bg-rose-600 hover:bg-rose-700"
                        onClick={() => handleRSVP("ACCEPTED")}
                        disabled={!isVerified || isRsvpLoading}
                      >
                        {isRsvpLoading ? "Updating..." : "Accept"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-32"
                        onClick={() => handleRSVP("DECLINED")}
                        disabled={!isVerified || isRsvpLoading}
                      >
                        {isRsvpLoading ? "Updating..." : "Decline"}
                      </Button>
                    </div>
                  )}

                  {/* Post-RSVP States */}
                  {invitation.status === "ACCEPTED" && (
                    <div className="space-y-6">
                      <p className="text-center text-green-600 font-medium">
                        You're going to dinner!<br />
                        Feel free to ask me any questions you have before the gathering.
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
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "What can the Spirit of Dinner do?",
                      "What are the details of the dinner?",
                      "What should I wear?",
                      "What's on the menu?",
                      "Who else is going to be there?",
                      "Schedule a dinner for me and my friends"
                    ].map((question, index) => (
                      <div
                        key={index}
                        onClick={() => chatRef.current?.sendMessage(question)}
                        className="bg-gray-100 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && chatRef.current?.sendMessage(question)}
                      >
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {!isVerified && (
          <VerificationModal
            open={true}
            onClose={() => {}} // Cannot be closed
            onSuccess={handleVerificationSuccess}
            inviteToken={token}
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
