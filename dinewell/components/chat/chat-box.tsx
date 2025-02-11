"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect, useMemo } from "react"
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
  const { user, isLoaded: isUserLoaded } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate the appropriate room ID based on context
  const roomId = useMemo(() => {
    // Wait for user to load
    if (!isUserLoaded) {
      return null;
    }

    // If we have an event ID and invitation token, it's an invite chat
    if (eventId && invitationToken) {
        console.log("********* Invite Room Id ***********")
        console.log("eventId", eventId)
        console.log("invitationToken", invitationToken)
      const roomId = generateInviteRoomId(eventId, invitationToken);
      console.log(" [ChatBox] Generated invite room ID:", {
        eventId,
        invitationToken,
        roomId
      });
      return roomId;
    }
    // If we have an event ID and user ID, it's a host chat
    if (eventId && user?.id) {
        console.log("********* Host Room Id ***********")
        console.log("eventId", eventId)
        console.log("userId", user.id)
      const roomId = generateHostRoomId(eventId, user.id);
      console.log(" [ChatBox] Generated host room ID:", {
        eventId,
        userId: user.id,
        roomId
      });
      return roomId;
    }

    // Return null if we don't have required parameters yet
    return null;
  }, [eventId, invitationToken, user?.id, isUserLoaded])

  // Load message history
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  useEffect(() => {
    const loadMessageHistory = async () => {
      if (!isUserLoaded) {
        return
      }

      // Skip message history for landing page
      if (eventId === "landing") {
        setIsHistoryLoading(false)
        if (initialMessage) {
          setMessages([{ text: initialMessage, user: "assistant" }])
        }
        return
      }

      // Wait for both agentId and roomId to be available
      if (!agentId || !roomId) {
        return
      }

      setIsHistoryLoading(true)
      try {
        console.log("roomId", roomId);
        console.log("agentId", agentId);

        const res = await fetch(`/${agentId}/messages/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch message history")
        }

        const data = await res.json()

        console.log("data", data);

        // Process messages to show only what we want
        const messages = [...data];

        // Get the first 3-4 messages where the invitation should be
        const firstMessages = messages.slice(0, 4);
        const invitationMessageIndex = firstMessages.findIndex(
          msg => msg.content?.type === "invitation_message"
        );

        if (invitationMessageIndex !== -1) {
          // Keep only the invitation message from the beginning
          const invitationMessage = firstMessages[invitationMessageIndex];
          // Get all messages starting from index 3 (where user interaction begins)
          const laterMessages = messages.slice(3);
          // Replace all messages with invitation message + later conversation
          messages.length = 0; // Clear the array
          messages.push(invitationMessage, ...laterMessages);
        }

        // Transform API messages to match current Message interface
        const transformedMessages = messages.map((apiMessage: any): Message => ({
          text: apiMessage.content.text,
          user: apiMessage.content.user === "user" ? "user" : "assistant"
        }))

        console.log("transformedMessages", transformedMessages);

        // If we have history, use it; otherwise use initial message
        if (transformedMessages.length > 0) {
            console.log("********* Using history ***********")
          setMessages(transformedMessages)
        } else if (initialMessage) {
            console.log("********* Using initial message ***********")
          setMessages([{ text: initialMessage, user: "assistant" }])
        }
      } catch (error) {
        console.error('Error fetching message history:', error)
      } finally {
        setIsHistoryLoading(false)
      }
    }

    loadMessageHistory()
  }, [agentId, roomId, initialMessage, isUserLoaded, eventId])

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      if (!agentId || !roomId) {
        throw new Error("Cannot send message: missing required parameters")
      }

      const res = await fetch(`/${agentId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          userId: user?.id || "invite",
          roomId,
          origin: eventId,
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

  if (isHistoryLoading) {
    return (
      <Card className="flex flex-col h-[427px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">Loading chat history...</p>
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

  if (!isUserLoaded) {
    return (
      <Card className="flex flex-col h-[427px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">Loading user data...</p>
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
                  className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap ${
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
            disabled={!input.trim() || mutation.isPending}
            className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 transition"
          >
            {mutation.isPending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </Card>
  )
})
