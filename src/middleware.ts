// // import { NextResponse } from 'next/server';
// // import type { NextRequest } from 'next/server';

// // export async function middleware(request: NextRequest) {
// //   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
// //     headers: request.headers,
// //     credentials: 'include',
// //   });

// //   const data = await response.json();

// //   if (!data.valid) {
// //     return NextResponse.redirect(new URL('/login', request.url));
// //   }

// //   return NextResponse.next();
// // }

// // export const config = {
// //   matcher: ['/dashboard/:path*'],
// // };

// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export async function middleware(request: NextRequest) {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
//     headers: request.headers,
//     credentials: 'include',
//   });

//   const data = await response.json();

//   const isAuthenticated = data.valid;
//   const pathname = request.nextUrl.pathname;

//   if (!isAuthenticated) {
//     return NextResponse.redirect(new URL('/login', request.url));
//   }

//   if (isAuthenticated && pathname === '/login') {
//     return NextResponse.redirect(new URL('/dashboard', request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/login'],
// };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate`, {
    headers: request.headers,
    credentials: 'include',
  });

  const data = await response.json();
  const isAuthenticated = data.valid;
  const pathname = request.nextUrl.pathname;

  const protectedRoutes = ['/dashboard', '/insights', '/astrabot', '/milestone-hub', '/inbox', '/settings'];

  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/insights/:path*', '/astrabot/:path*', '/milestone-hub/:path*', '/inbox/:path*', '/settings/:path*', '/login'],
};