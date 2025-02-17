import { NextResponse } from "next/server";
import Nylas from "nylas";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "Missing user ID" },
                { status: 400 }
            );
        }

        if (!process.env.NYLAS_CLIENT_SECRET) {
            console.error("Missing Nylas credentials");
            return NextResponse.json(
                { error: "Missing Nylas configuration" },
                { status: 500 }
            );
        }

        console.log("Initializing Nylas...");

        // Initialize Nylas
        const nylas = new Nylas({
            apiKey: process.env.NYLAS_CLIENT_SECRET!,
            apiUri: "https://api.us.nylas.com",
        });

        // Generate OAuth URL
        const authUrl = nylas.auth.urlForOAuth2({
            clientId: process.env.NYLAS_CLIENT_ID!,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`,
            scope: ["calendar"],
            state: userId, // Pass the userId as state to retrieve it in callback
        });

        console.log("Generated auth URL:", authUrl);

        return NextResponse.json({ authUrl });
    } catch (error) {
        console.error("Failed to generate auth URL:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to start calendar connection",
            },
            { status: 500 }
        );
    }
}
