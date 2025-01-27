"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useFirstAgent } from "@/hooks/useFirstAgent"
import { useUser } from "@clerk/nextjs"
import { generateHostRoomId, generateInviteRoomId } from "@/lib/room-id"

interface Message {
  text: string
  user: string
}

interface ChatBoxProps {
  eventId?: string
  invitationToken?: string
  initialMessage?: string
}

export interface ChatBoxRef {
  sendMessage: (text: string) => void
}

export const ChatBox = forwardRef<ChatBoxRef, ChatBoxProps>(({ eventId, invitationToken, initialMessage }, ref) => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ text: initialMessage, user: "assistant" }] : []
  )
  const { agentId, isLoading, error } = useFirstAgent()
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate the appropriate room ID based on context
  const getRoomId = () => {
    // If we have an event ID and invitation token, it's an invite chat
    if (eventId && invitationToken) {
      return generateInviteRoomId(eventId, invitationToken)
    }
    // If we have an event ID and user ID, it's a host chat
    if (eventId && user?.id) {
      return generateHostRoomId(eventId, user.id)
    }
    // Default to a generic room ID for the landing page
    return `default-room-${agentId}`
  }

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      if (!agentId) throw new Error("No agent selected")

      const roomId = getRoomId()

      const res = await fetch(`/${agentId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          userId: user?.id || "invite",
          roomId,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to send message")
      }

      return res.json() as Promise<Message[]>
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, ...data])
    },
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !agentId) return

    // Add user message immediately
    const userMessage: Message = {
      text: input,
      user: "user",
    }
    setMessages((prev) => [...prev, userMessage])

    // Send to API
    mutation.mutate(input)
    setInput("")
  }

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      const userMessage: Message = {
        text,
        user: "user",
      }
      setMessages((prev) => [...prev, userMessage])
      mutation.mutate(text)
      setInput("")
    }
  }))

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[427px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">Connecting to Mr. Dinewell...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[427px] w-full shadow-lg items-center justify-center">
        <p className="text-destructive">Unable to connect to Mr. Dinewell. Please ensure the agent server is running.</p>
      </Card>
    )
  }

  if (!agentId) {
    return (
      <Card className="flex flex-col h-[427px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">No agents available. Please start the agent server.</p>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-md">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 h-[427px]">
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.user === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.user === "user"
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                No messages yet. Start a conversation with the Spirit of Dinner!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </Card>
  )
})
