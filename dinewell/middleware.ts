import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes including both page and API routes
const isPublicRoute = createRouteMatcher([
    "/",
    "/invite(.*)", // Invite pages
    "/api/invite(.*)", // Invite API routes
    "/api/agents(.*)", // Agent API routes
    "/agents(.*)", // Agent pages
    "/:agentId/message", // Agent message routes
    "/:agentId/messages/:roomId", // Agent messages routes
    "/dashboard(.*)",
    "/events(.*)",
    "/api/events(.*)", // Events API routes
    "/verify(.*)", // Verify pages
    "/api/verify(.*)", // Verify API routes
]);

// Protected routes (everything else except public routes)
const isProtectedRoute = createRouteMatcher([
    "/((?!invite|api/invite|api/agents|agents|events|api/events|verify|api/verify).*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }
    if (isProtectedRoute(req)) {
        return auth.protect();
    }
    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/"],
};
