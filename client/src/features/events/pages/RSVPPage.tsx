import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { getEvent } from "@/lib/api/events";
import { getInvitation, updateInvitationStatus } from "@/lib/api/invitations";
import { Check, X } from "lucide-react";

export default function RSVPPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: invitation, isLoading: isLoadingInvitation } = useQuery({
    queryKey: ["invitation", id],
    queryFn: () => getInvitation(id!),
    enabled: !!id,
  });

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", invitation?.eventId],
    queryFn: () => getEvent(invitation!.eventId),
    enabled: !!invitation?.eventId,
  });

  const updateMutation = useMutation({
    mutationFn: (status: "accepted" | "declined") =>
      updateInvitationStatus(id!, { status }),
    onSuccess: () => {
      toast({
        title: "RSVP updated",
        description: "Your response has been recorded.",
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingInvitation || isLoadingEvent) {
    return <LoadingPage />;
  }

  if (!invitation || !event) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Invalid invitation link. Please check your invitation and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              You have already responded to this invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{event.title}</h2>
            <p className="text-muted-foreground">{event.description}</p>
            <div className="text-sm">
              <p>
                <strong>Location:</strong> {event.location}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(event.dateTime).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(event.dateTime).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => updateMutation.mutate("accepted")}
              disabled={updateMutation.isPending}
              variant="default"
              size="lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={() => updateMutation.mutate("declined")}
              disabled={updateMutation.isPending}
              variant="outline"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
