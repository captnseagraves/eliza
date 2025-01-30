"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { ChatBox } from "@/components/chat/chat-box"
import { PhoneInput } from "@/components/ui/phone-input"
import { Card } from "@/components/ui/card"

const formSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+1 \(\d{3}\) \d{3}-\d{4}$/, "Must be in format: +1 (XXX) XXX-XXXX"),
  personalMessage: z.string().optional(),
})

interface InvitationFormProps {
  eventId: string
}

export function InvitationForm({ eventId }: InvitationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [invitationLink, setInvitationLink] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      personalMessage: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setError("")

      // Normalize phone number to +1XXXXXXXXXX format
      const normalizedPhone = values.phoneNumber.replace(/\D/g, "")
      const formattedPhone = `+1${normalizedPhone.slice(-10)}`

      const response = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          phoneNumber: formattedPhone,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      const result = await response.json()
      const baseUrl = window.location.origin
      setInvitationLink(`${baseUrl}/invite/${result.token}`)
      form.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a personal message to your invitation..."
                      disabled={isLoading}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition"
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </button>

            {invitationLink && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">Invitation Link:</p>
                <p className="text-sm break-all">{invitationLink}</p>
              </div>
            )}
          </form>
        </Form>
      </Card>

      <div className="lg:border-l lg:pl-6">
        <ChatBox
          eventId={eventId}
          initialMessage="Let's organize a memorable gathering. How may I assist you with your event planning and invitations today?"
        />
      </div>
    </div>
  )
}
