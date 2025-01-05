"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Shield } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PhoneInput } from "@/components/ui/phone-input"

interface VerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: (phoneNumber: string) => void
}

const phoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
})

const codeSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6, "Verification code must be 6 digits"),
})

type PhoneFormValues = z.infer<typeof phoneSchema>
type CodeFormValues = z.infer<typeof codeSchema>

export function VerificationModal({
  open,
  onOpenChange,
  onVerified,
}: VerificationModalProps) {
  const [verificationStep, setVerificationStep] = useState<"phone" | "code">("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  })

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      phoneNumber: "",
      code: "",
    },
  })

  const handleSendCode = async (data: PhoneFormValues) => {
    try {
      setIsLoading(true)
      setError("")
      
      const normalizedPhone = data.phoneNumber.replace(/\D/g, "")
      const formattedPhone = `+1${normalizedPhone.slice(-10)}`

      const response = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send verification code")
      }

      setPhoneNumber(data.phoneNumber)
      codeForm.setValue("phoneNumber", data.phoneNumber)
      setVerificationStep("code")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (data: CodeFormValues) => {
    try {
      setIsLoading(true)
      setError("")
      
      const normalizedPhone = data.phoneNumber.replace(/\D/g, "")
      const formattedPhone = `+1${normalizedPhone.slice(-10)}`

      const response = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: formattedPhone, 
          code: data.code 
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Invalid verification code")
      }

      onVerified(formattedPhone)
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Phone Number</DialogTitle>
        </DialogHeader>
        
        {verificationStep === "phone" ? (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleSendCode)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <FormField
                control={phoneForm.control}
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
