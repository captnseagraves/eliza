"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFirstAgent } from "@/hooks/useFirstAgent"

interface Message {
  text: string
  user: string
}

interface ChatBoxProps {
  eventId: string
}

export function ChatBox({ eventId }: ChatBoxProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const { agentId, isLoading, error } = useFirstAgent()

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      if (!agentId) throw new Error("No agent selected")

      const res = await fetch(`/api/${agentId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          userId: "user",
          roomId: `default-room-${agentId}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[500px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">Connecting to Mr. Dinewell...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[500px] w-full shadow-lg items-center justify-center">
        <p className="text-destructive">Unable to connect to Mr. Dinewell. Please ensure the agent server is running.</p>
      </Card>
    )
  }

  if (!agentId) {
    return (
      <Card className="flex flex-col h-[500px] w-full shadow-lg items-center justify-center">
        <p className="text-muted-foreground">No agents available. Please start the agent server.</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[500px] w-full shadow-lg">
      <div className="bg-primary p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold text-primary-foreground">
          Chat with Mister Dinewell
        </h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.user === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.user === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              Greetings! I am Mister Dinewell, at your service. How may I assist you with your dinner arrangements? *adjusts monocle*
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4 bg-background rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to Mister Dinewell..."
            className="flex-1"
            disabled={mutation.isPending}
          />
          <Button type="submit" disabled={mutation.isPending || !agentId}>
            {mutation.isPending ? "..." : "Send"}
          </Button>
        </form>
      </div>
    </Card>
  )
}
