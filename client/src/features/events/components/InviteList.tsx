import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { getEventInvitations, Invitation } from "@/lib/api/invitations";
import { useState } from "react";

interface InviteListProps {
  eventId: string;
}

const PAGE_SIZE = 10;

export function InviteList({ eventId }: InviteListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invites", eventId, page],
    queryFn: () => getEventInvitations(eventId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Failed to load invitations. Please try again.
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No invitations sent yet
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentInvites = data.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentInvites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell>{invite.phoneNumber}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    invite.status === "accepted"
                      ? "success"
                      : invite.status === "declined"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {invite.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(invite.createdAt), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => setPage(pageNum)}
                  isActive={page === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
