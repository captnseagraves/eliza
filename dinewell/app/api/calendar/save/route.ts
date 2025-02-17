import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { tokens, agentUserId } = await req.json();

        if (!agentUserId) {
            return NextResponse.json(
                { error: "Agent user ID is required" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { agentUserId },
            data: {
                nylasAccessToken: tokens.accessToken,
                nylasRefreshToken: tokens.refreshToken,
                nylasAccountId: tokens.accountId,
                calendarConnected: true,
                calendarProvider: tokens.provider,
                calendarEmail: tokens.email,
                lastCalendarSync: new Date(),
                calendarScope: tokens.scope,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save calendar tokens:", error);
        return NextResponse.json(
            { error: "Failed to save calendar tokens" },
            { status: 500 }
        );
    }
}
