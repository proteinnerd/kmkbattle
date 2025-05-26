import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log API requests for debugging
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] API Request: ${request.method} ${request.nextUrl.pathname}`);
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  return NextResponse.next();
}

// Only run the middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 