"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CalendarConnectProps {
  onConnect?: () => void
  agentUserId: string
}

export const CalendarConnect = ({ onConnect, agentUserId }: CalendarConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    if (!agentUserId) {
      toast({
        title: "Error",
        description: "No user ID available",
        variant: "destructive",
      })
      return
    }

    try {
      setIsConnecting(true)

      // Start OAuth flow with agent user ID
      const response = await fetch("/api/calendar/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: `${agentUserId}` }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start calendar connection")
      }

      // Open OAuth window
      window.location.href = data.authUrl
    } catch (error) {
      console.error("Failed to connect calendar:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect calendar",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      <Calendar className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Calendar"}
    </Button>
  )
}
