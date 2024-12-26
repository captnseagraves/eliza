import { Event } from "@/types/event";
import { EventCard } from "./EventCard";

interface EventListProps {
  events: Event[];
  onViewEvent: (id: string) => void;
}

export function EventList({ events, onViewEvent }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No events found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onView={onViewEvent} />
      ))}
    </div>
  );
}
