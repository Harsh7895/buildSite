import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl; // Current URL object
  const searchParams = url.searchParams.toString(); // Query parameters
  const hostname = req.headers.get('host'); // Full hostname (e.g., "localhost:3000")
  const pathWithSearchParams = `${url.pathname}${
    searchParams ? `?${searchParams}` : ''
  }`; // Full path with query params

  // Check if we are in development (localhost)
  const isLocalhost = hostname?.includes('localhost');

  // Handle subdomain logic
  let customSubDomain;
  if (!isLocalhost) {
    // Extract subdomain for non-localhost environments
    customSubDomain = hostname
      ?.split(process.env.NEXT_PUBLIC_DOMAIN) // Split by the main domain
      .filter(Boolean)[0]; // The first part will be the subdomain if it exists
  }

  // Rewrite requests for subdomains
  if (customSubDomain) {
    return NextResponse.rewrite(
      new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
    );
  }

  // Redirect specific routes
  if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
    return NextResponse.redirect(new URL(`/agency/sign-in`, req.url));
  }

  // Rewrite root or `/site` requests to `/site`
  if (
    url.pathname === '/' ||
    (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)
  ) {
    return NextResponse.rewrite(new URL('/site', req.url));
  }

  // Allow specific paths under `/agency` or `/subaccount` without modification
  if (
    url.pathname.startsWith('/agency') ||
    url.pathname.startsWith('/subaccount')
  ) {
    return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url));
  }

  return NextResponse.next(); // Allow all other requests to proceed
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
