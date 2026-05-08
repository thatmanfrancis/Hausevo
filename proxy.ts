import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
  proxy.ts — Next.js 16 equivalent of middleware.ts
  
  Currently passes all requests through.
  Route protection will be added once the frontend is built.
*/
export function proxy(req: NextRequest) {
  return NextResponse.next();
}

// Only run on protected app routes — not on API routes or static files
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/artisan/:path*",
  ],
};
