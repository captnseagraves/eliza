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
  onClose: () => void
  onSuccess: (data: { phoneNumber: string }) => void
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
  onClose,
  onSuccess,
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

      console.log('Sending verification check request to:', '/api/verify/check')
      console.log('With data:', { phoneNumber: formattedPhone, code: data.code })

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

      onSuccess({ phoneNumber: formattedPhone })
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
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

              <Button type="submit" disabled={isLoading} className="w-full bg-rose-600 text-white hover:bg-rose-700 transition">
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

              <div className="text-sm text-muted-foreground mb-4">
                Enter the verification code sent to {phoneNumber}
              </div>

              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        disabled={isLoading}
                        className="text-center tracking-[1em] text-lg font-mono"
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
                className="w-full bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
