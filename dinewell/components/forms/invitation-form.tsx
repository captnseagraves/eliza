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
      const response = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      const result = await response.json()
      const baseUrl = window.location.origin
      setInvitationLink(`${baseUrl}/invite/${result.token}`)

      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error sending invitation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {invitationLink && (
          <div className="text-sm text-muted-foreground break-all">
            Invitation Link: {invitationLink}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
