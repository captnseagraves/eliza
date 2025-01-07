import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api(.*)"]);
const isPublicRoute = createRouteMatcher(["/invite(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return;
    if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/"],
};
