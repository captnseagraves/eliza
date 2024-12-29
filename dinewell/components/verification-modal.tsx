import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Shield } from "lucide-react"

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (phoneNumber: string) => void
  intentAction: "ACCEPTED" | "DECLINED"
}

export function VerificationModal({
  isOpen,
  onClose,
  onVerified,
  intentAction,
}: VerificationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationStep, setVerificationStep] = useState<"phone" | "code">("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendVerification = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send verification code")
      }

      setVerificationStep("code")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Invalid verification code")
      }

      onVerified(phoneNumber)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPhoneNumber("")
    setVerificationCode("")
    setVerificationStep("phone")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Verify Your Phone to {intentAction === "ACCEPTED" ? "Accept" : "Decline"}
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="text-sm text-destructive text-center">
            {error}
          </div>
        )}
        {verificationStep === "phone" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Enter Your Phone Number</h2>
            </div>
            <Input
              type="tel"
              placeholder="+1 (555) 555-5555"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={handleSendVerification}
              disabled={isLoading || !phoneNumber}
              className="w-full"
            >
              Send Verification Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Enter Verification Code</h2>
            </div>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full"
              maxLength={6}
            />
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              Verify Code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
