import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Context {
    params: {
        token: Promise<string>;
    };
}

export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const token = await params.token;
        
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

export async function PATCH(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const token = await params.token;
        const body = await request.json()
        const { status } = body

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
        console.error("[INVITATION_PATCH]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}
