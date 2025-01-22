"use client"

import { useState } from "react"
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import Cookies from 'js-cookie'

interface VerificationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (data: { phoneNumber: string }) => void
  inviteToken: string
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

const COOKIE_EXPIRY_DAYS = 30

export function VerificationModal({
  open,
  onClose,
  onSuccess,
  inviteToken,
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

      // Set verification cookie
      Cookies.set(`verified_invite_${inviteToken}`, formattedPhone, {
        expires: COOKIE_EXPIRY_DAYS,
        sameSite: 'strict'
      })

      onSuccess({ phoneNumber: formattedPhone })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-md border-0 p-0 gap-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              Verify Your Phone Number
            </DialogTitle>
          </DialogHeader>

          {verificationStep === "phone" ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(handleSendCode)} className="space-y-4 mt-4">
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
                      <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={isLoading}
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className="space-y-4 mt-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Enter the verification code sent to {phoneNumber}
                </div>

                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          disabled={isLoading}
                          className="text-center tracking-[1em] text-lg font-mono h-10 rounded-md border border-input bg-background px-3 py-2"
                          autoComplete="one-time-code"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
