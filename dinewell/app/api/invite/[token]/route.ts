import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    context: { params: { token: string } }
) {
    try {
        const { token } = context.params
        const invitation = await prisma.invitation.findUnique({
            where: {
                invitationToken: token,
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

export async function POST(
    request: Request,
    context: { params: { token: string } }
) {
    try {
        const { token } = context.params
        const body = await request.json()
        const { status, phoneNumber } = body

        if (!["ACCEPTED", "DECLINED"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 })
        }

        const invitation = await prisma.invitation.update({
            where: {
                invitationToken: token,
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
        console.error("[INVITATION_POST]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}
