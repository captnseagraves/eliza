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

        console.log("token", token);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white border-b z-[100] pointer-events-auto">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="text-lg font-medium">
            Dinner.fun
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
                      invitationToken={token}
                      initialMessage={invitation.personalMessage}
                    />
                  </div>

                  <div className="-mt-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Yes, I would love to come to dinner",
                        "I won't be able to attend",
                        "What is my RSVP status?",
                        "What are the details of the dinner?",
                        "What should I wear?",
                        "What's on the menu?",
                        "Who else is going to be there?",
                        "What can the Spirit of Dinner do?",
                        "Schedule a dinner for me and my friends",
                        "What is $DINE?"
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

                    <div className="flex flex-wrap gap-4 justify-center items-center mt-6">
                      <AddToCalendarButton
                        name={invitation.event.name}
                        description={invitation.event.description || "Join us for dinner!"}
                        startDate={format(new Date(invitation.event.date), 'yyyy-MM-dd')}
                        startTime={format(parseISO(`2000-01-01T${invitation.event.time}`), 'HH:mm')}
                        endTime={format(addHours(parseISO(`2000-01-01T${invitation.event.time}`), 2), 'HH:mm')}
                        location={invitation.event.location}
                        options={['Google', 'Apple', 'Microsoft365', 'MicrosoftTeams']}
                        buttonStyle="round"
                        size="4"
                        listStyle="overlay"
                        styleLight="--btn-background: #e11d48; --btn-text: #ffffff;"
                      />

                      <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${invitation.event.latitude ? `${invitation.event.latitude},${invitation.event.longitude}` : encodeURIComponent(invitation.event.location)}`, '_blank')}
                        className="bg-[#e11d48] text-white px-9 py-1 rounded-full flex items-center gap-2 shadow-lg hover:bg-white hover:text-black hover:border-gray-400 transition-all h-10 border border-transparent border-[0.5px]"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="font-bold">Location</span>
                      </button>
                    </div>
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
