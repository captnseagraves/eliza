"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatBox } from "@/components/chat/chat-box"

export default function InvitationsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Invitations</h1>
        <p className="text-muted-foreground">
          Send and manage invitations for your event
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Guest List</h2>
            {/* Guest list management will go here */}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Invitation Settings</h2>
            {/* Settings form will go here */}
          </Card>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="compose">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="compose" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Compose Invitation Message
                </h2>
                {/* Message composition form will go here */}
              </Card>
              <ChatBox eventId={eventId} />
            </TabsContent>
            <TabsContent value="preview">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Invitation Preview
                </h2>
                {/* Preview will go here */}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
