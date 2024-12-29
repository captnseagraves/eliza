import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: {
        invitationToken: params.token,
      },
      include: {
        event: true,
      },
    })

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("[INVITATION_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json()
    const { status } = body

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const invitation = await prisma.invitation.update({
      where: {
        invitationToken: params.token,
      },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        event: true,
      },
    })

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("[INVITATION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
