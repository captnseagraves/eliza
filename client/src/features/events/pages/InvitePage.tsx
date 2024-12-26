import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "../components/InviteForm";
import { InviteList } from "../components/InviteList";
import { getEvent } from "@/lib/api/events";

export default function InvitePage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Invitations</CardTitle>
          <InviteForm eventId={id!} onInviteSent={() => {}} />
        </CardHeader>
        <CardContent className="pt-6">
          <InviteList eventId={id!} />
        </CardContent>
      </Card>
    </div>
  );
}
