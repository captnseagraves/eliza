import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, getEvent, updateEvent } from "@/lib/api/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { EventForm } from "../components/EventForm";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  dateTime: z.date(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventFormData }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
      navigate("/events");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingEvent || createMutation.isPending || updateMutation.isPending;

  if (id && isLoadingEvent) {
    return <LoadingPage />;
  }

  const handleSubmit = async (data: EventFormData) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled in mutation callbacks
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? "Edit Event" : "Create Event"}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={handleSubmit}
            initialData={event}
            isLoading={isLoading}
            validationSchema={eventSchema}
          />
        </CardContent>
      </Card>
    </div>
  );
}
