import { NextResponse } from "next/server";
import Nylas, { Calendar } from "nylas";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const agentUserId = url.searchParams.get("state"); // This is our userId from the auth step

        console.log('Received agent user ID:', agentUserId);
        
        if (!code) {
            return new NextResponse(
                JSON.stringify({ error: "No code provided" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!agentUserId) {
            return new NextResponse(
                JSON.stringify({ error: "No valid user ID provided" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Nylas
        const nylas = new Nylas({
            apiKey: process.env.NYLAS_CLIENT_SECRET!,
            apiUri: "https://api.us.nylas.com",
        });

        // Exchange code for tokens
        try {
            const response = await nylas.auth.exchangeCodeForToken({
                clientId: process.env.NYLAS_CLIENT_ID!,
                clientSecret: process.env.NYLAS_CLIENT_SECRET!,
                code: code,
                redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
            });

            console.log("Token exchange response:", response);

            const { grantId, accessToken, email } = response;

            // Get primary calendar
            const calendarsList = await nylas.calendars.list({
                identifier: grantId,
            }).then(response => response.data);

            console.log("Calendars list:", calendarsList);

            const primaryCalendar =
                calendarsList.find((cal) => cal.isPrimary) || calendarsList[0];

            if (!primaryCalendar) {
                return new NextResponse(
                    JSON.stringify({ error: "No calendar found" }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            console.log("Selected primary calendar:", primaryCalendar);

            try {
                console.log('Starting database update...');
                console.log('Agent user ID for update:', agentUserId);
                
                // Save to database
                try {
                    const updatedUser = await prisma.user.update({
                        where: { agentUserId },
                        data: {
                            nylasAccessToken: accessToken,
                            calendarConnected: true,
                            calendarProvider: "nylas",
                            calendarEmail: email || "",
                            calendarId: primaryCalendar.id,
                            lastCalendarSync: new Date(),
                        },
                    });
                    console.log('Database update successful:', updatedUser.id);

                    // Redirect back to invitation page
                    console.log('Creating redirect URL...');
                    const redirectUrl = new URL(
                        "/invite",
                        process.env.NEXT_PUBLIC_APP_URL!
                    );
                    redirectUrl.searchParams.set("calendar", "connected");
                    console.log('Redirecting to:', redirectUrl.toString());

                    return NextResponse.redirect(redirectUrl.toString());
                } catch (prismaError) {
                    console.log('Prisma error details:', {
                        error: prismaError instanceof Error ? prismaError.message : 'Unknown prisma error',
                        code: (prismaError as any)?.code,
                        meta: (prismaError as any)?.meta
                    });
                    
                    return NextResponse.json(
                        { error: "Failed to update user record" },
                        { status: 500 }
                    );
                }
            } catch (dbError) {
                console.log('Outer database error:', {
                    error: dbError instanceof Error ? dbError.message : 'Unknown error',
                    agentUserId,
                    accessToken: accessToken ? 'present' : 'missing',
                    email: email ? 'present' : 'missing',
                    calendarId: primaryCalendar?.id ? 'present' : 'missing'
                });
                
                return NextResponse.json(
                    { error: "Failed to save calendar connection" },
                    { status: 500 }
                );
            }
        } catch (nylasError) {
            console.log('Nylas error details:', {
                error: nylasError instanceof Error ? nylasError.message : 'Unknown error',
                code: (nylasError as any)?.code,
                meta: (nylasError as any)?.meta
            });
            
            return NextResponse.json(
                { error: "Failed to connect calendar" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.log('General error occurred');
        return NextResponse.json(
            { error: "Failed to connect calendar" },
            { status: 500 }
        );
    }
}
