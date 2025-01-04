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
  invitationToken: string
  personalMessage: string
  createdAt: Date
  respondedAt: Date | null
}

interface InvitationListProps {
  invitations: Invitation[]
}

export function InvitationList({ invitations }: InvitationListProps) {
  if (!invitations.length) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No invitations sent yet
      </div>
    )
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/invite/${token}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Responded</TableHead>
            <TableHead>Invitation URL</TableHead>
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
                      : "secondary"
                  }
                >
                  {invitation.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(invitation.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>
                {invitation.respondedAt
                  ? format(new Date(invitation.respondedAt), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {getInviteUrl(invitation.invitationToken)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
