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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChatBox } from "@/components/chat/chat-box"

const formSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+1\d{10}$/, "Must be in format: +1XXXXXXXXXX"),
  personalMessage: z.string().optional(),
})

type InvitationFormValues = z.infer<typeof formSchema>

interface InvitationFormProps {
  eventId: string
}

export function InvitationForm({ eventId }: InvitationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [invitationLink, setInvitationLink] = useState<string>("")
  const [error, setError] = useState<string>("")

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      personalMessage: "",
    },
  })

  const onSubmit = async (data: InvitationFormValues) => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const text = await response.text()
        let message: string
        try {
          const json = JSON.parse(text)
          message = json.error || "Failed to send invitation"
        } catch {
          message = text || "Failed to send invitation"
        }
        throw new Error(message)
      }

      const result = await response.json()
      const baseUrl = window.location.origin
      setInvitationLink(`${baseUrl}/invite/${result.token}`)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error sending invitation:", error)
      setError(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Input 
                    {...field} 
                    placeholder="+1XXXXXXXXXX"
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>

          {invitationLink && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-medium">Invitation Link:</p>
              <p className="text-sm break-all">{invitationLink}</p>
            </div>
          )}
        </form>
      </Form>

      <div className="lg:border-l lg:pl-6">
        <ChatBox eventId={eventId} />
      </div>
    </div>
  )
}
