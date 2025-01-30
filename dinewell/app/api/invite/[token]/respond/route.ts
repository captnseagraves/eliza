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
    console.log("📥 [RSVP API] Starting POST request handler", {
        timestamp: new Date().toISOString(),
        token: params.token,
    });

    try {
        // Get token from params
        const token = params.token;
        console.log("🔑 [RSVP API] Processing token:", token);

        // Parse body
        const body = await request.json();
        console.log("📦 [RSVP API] Request body:", body);
        const { status, phoneNumber } = body;

        // Validate input
        if (!status) {
            console.error("❌ [RSVP API] Missing status in request");
            return new NextResponse("Status is required", { status: 400 });
        }

        if (!["ACCEPTED", "DECLINED"].includes(status)) {
            console.error("❌ [RSVP API] Invalid status:", status);
            return new NextResponse("Invalid status", { status: 400 });
        }

        // Find invitation
        console.log("🔍 [RSVP API] Finding invitation");
        const invitation = await prisma.invitation.findUnique({
            where: { invitationToken: token },
            include: {
                event: true,
            },
        });

        if (!invitation) {
            console.error("❌ [RSVP API] Invitation not found");
            return new NextResponse("Not found", { status: 404 });
        }
        console.log("📝 [RSVP API] Found invitation:", invitation);

        // Verify phone number if provided
        if (phoneNumber && invitation.phoneNumber !== phoneNumber) {
            console.error(
                "❌ [RSVP API] Phone number does not match invitation"
            );
            return new NextResponse("Phone number does not match invitation", {
                status: 403,
            });
        }

        // Update invitation
        console.log("🔄 [RSVP API] Updating invitation");
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
            console.log("📈 [RSVP API] Update successful:", updated);

            return NextResponse.json(updated);
        } catch (updateError) {
            console.error("❌ [RSVP API] Update failed:", updateError);
            return new NextResponse("Failed to update", { status: 500 });
        }
    } catch (error) {
        console.error("❌ [RSVP API] Error:", { error });
        return new NextResponse("Error", { status: 500 });
    }
}
