import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Send, Plus } from "lucide-react";
import { createInvitation } from "@/lib/api/invitations";
import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const inviteSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid phone number format. Use international format: +1234567890"),
});

interface InviteFormProps {
  eventId: string;
  onInviteSent: () => void;
}

export function InviteForm({ eventId, onInviteSent }: InviteFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(eventId, { phoneNumber }),
    onSuccess: () => {
      setPhoneNumber("");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invites", eventId] });
      toast({
        title: "Invitation sent",
        description: "The guest has been invited to the event.",
      });
      onInviteSent();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      inviteSchema.parse({ phoneNumber });
      inviteMutation.mutate();
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Invite Guest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Guest</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setValidationError(null);
              }}
              className={validationError ? "border-red-500" : ""}
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
