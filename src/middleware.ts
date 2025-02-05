import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
    headers: request.headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!data.valid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
