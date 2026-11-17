import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Browsing is public so visitors can explore and listen before signing up.
// Only creating content requires an account. The Convex backend enforces auth
// on every write as well, so this check is for UX, not for security.
const isProtectedRoute = createRouteMatcher(["/create-podcast(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp3)).*)",
    "/(api|trpc)(.*)",
  ],
};
