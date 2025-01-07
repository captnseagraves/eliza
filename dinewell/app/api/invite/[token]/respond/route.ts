import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
    params: {
        token: string;
    };
}

export async function POST(
    request: Request,
    { params }: { params: { token: string } }
) {
    console.log("1. Starting POST request handler");
    try {
        // Get token from params
        const token = await params.token;
        console.log("2. Token:", token);

        // Parse body
        const body = await request.json();
        console.log("3. Body:", body);
        const { status, phone } = body;

        // Validate input
        if (!status || !phone) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (!["ACCEPTED", "DECLINED"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        // Find invitation
        console.log("4. Finding invitation");
        const invitation = await prisma.invitation.findUnique({
            where: { invitationToken: token },
            include: {
                event: true,
            },
        });

        if (!invitation) {
            return new NextResponse("Not found", { status: 404 });
        }
        console.log("5. Found invitation:", invitation);

        // Update invitation
        console.log("6. Updating invitation");
        try {
            const updated = await prisma.invitation.update({
                where: { id: invitation.id },
                data: {
                    status,
                    respondedAt: new Date(),
                },
                include: {
                    event: true,
                },
            });
            console.log("7. Update successful:", updated);

            return NextResponse.json(updated);
        } catch (updateError) {
            console.error("8. Update failed:", updateError);
            return new NextResponse("Failed to update", { status: 500 });
        }
    } catch (error) {
        console.error("9. Error:", { error });
        return new NextResponse("Error", { status: 500 });
    }
}
