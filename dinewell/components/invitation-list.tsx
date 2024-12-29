"use client"

import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Invitation = {
  id: string
  phoneNumber: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  createdAt: Date
  respondedAt: Date | null
}

interface InvitationListProps {
  invitations: Invitation[]
}

export function InvitationList({ invitations }: InvitationListProps) {
  if (!invitations.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No invitations sent yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Responded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.phoneNumber}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    invitation.status === "ACCEPTED"
                      ? "success"
                      : invitation.status === "DECLINED"
                      ? "destructive"
                      : "default"
                  }
                >
                  {invitation.status.charAt(0) + invitation.status.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(invitation.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>
                {invitation.respondedAt
                  ? format(new Date(invitation.respondedAt), "MMM d, yyyy")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
