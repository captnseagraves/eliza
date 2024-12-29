"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { format } from "date-fns"

const inviteFormSchema = z.object({
  phoneNumber: z.string().regex(/^\+1\d{10}$/, {
    message: "Phone number must be in format: +1XXXXXXXXXX",
  }),
  personalMessage: z.string().min(1, {
    message: "Please include a personal message.",
  }),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface Invitation {
  id: string
  phoneNumber: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  createdAt: string
  respondedAt: string | null
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
}

export default function ManageEventPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      phoneNumber: "",
      personalMessage: "",
    },
  })

  useEffect(() => {
    // Fetch event details
    fetch(`/api/events/${params.eventId}`)
      .then((res) => res.json())
      .then(setEvent)

    // Fetch invitations
    fetch(`/api/events/${params.eventId}/invitations`)
      .then((res) => res.json())
      .then(setInvitations)
  }, [params.eventId])

  async function onSubmit(data: InviteFormValues) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/events/${params.eventId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      const newInvitation = await response.json()
      setInvitations((prev) => [newInvitation, ...prev])
      form.reset()
    } catch (error) {
      console.error("Error sending invitation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!event) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground">
            {format(new Date(event.date), "MMMM d, yyyy")} at {event.time}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite Guests</CardTitle>
              <CardDescription>
                Send personalized invitations to your guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1XXXXXXXXXX" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the phone number in format: +1XXXXXXXXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a personal touch to your invitation..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Invitation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
              <CardDescription>
                Track your guest responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invitation.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          invitation.status === "ACCEPTED"
                            ? "bg-green-500"
                            : invitation.status === "DECLINED"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {invitation.status}
                      </span>
                    </div>
                  </div>
                ))}

                {invitations.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No invitations sent yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
