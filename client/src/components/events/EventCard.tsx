import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import { formatDate } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onView: (id: string) => void;
}

export function EventCard({ event, onView }: EventCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription>{formatDate(event.dateTime)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
        <p className="text-sm mb-4">📍 {event.location}</p>
        <Button onClick={() => onView(event.id)} variant="outline" className="w-full">
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
