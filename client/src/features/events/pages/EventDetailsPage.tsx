import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteEvent, getEvent } from "@/lib/api/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Loader2, Pencil, Trash, Users } from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { InviteList } from "../components/InviteList";
import { InviteForm } from "../components/InviteForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
      navigate("/events");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-bold">{event.title}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/events/${id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this event? This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(id!)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="guests">
                <Users className="h-4 w-4 mr-2" />
                Guests
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-muted-foreground">{event.location.address}</p>
              </div>
              <div>
                <h3 className="font-medium">Date and Time</h3>
                <p className="text-muted-foreground">
                  {format(new Date(event.dateTime), "PPP")}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="guests" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <InviteForm eventId={id!} onInviteSent={() => {
                    queryClient.invalidateQueries({ queryKey: ["invites", id] });
                    toast({
                      title: "Invitation sent",
                      description: "The guest has been invited to the event.",
                    });
                  }} />
                </div>
                <InviteList eventId={id!} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
