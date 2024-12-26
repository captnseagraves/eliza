import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EventList } from "@/components/events/EventList";
import { getEvents } from "@/lib/api/events";

export default function EventsPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading events...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading events: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => navigate("/events/new")}>Create Event</Button>
      </div>
      <EventList events={events} onViewEvent={(id) => navigate(`/events/${id}`)} />
    </div>
  );
}
