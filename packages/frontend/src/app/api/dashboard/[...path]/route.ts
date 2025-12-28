import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const url = `${BACKEND_URL}/api/v1/dashboard/${path}${request.nextUrl.search}`;

  try {
    // Get NextAuth session to extract backend token
    const session = await getServerSession(authOptions);
    console.log('[Dashboard Proxy] Session:', {
      hasSession: !!session,
      hasToken: !!(session?.user as any)?.token,
    });

    // Forward all headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Add Authorization header with backend JWT token from NextAuth session
    if (session?.user && (session.user as any).token) {
      headers.set('Authorization', `Bearer ${(session.user as any).token}`);
      console.log('[Dashboard Proxy] Added Authorization header');
    } else {
      console.log('[Dashboard Proxy] No token found in session');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    console.log('[Dashboard Proxy] Backend response:', {
      status: response.status,
      success: data.success,
    });

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[Dashboard Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const url = `${BACKEND_URL}/api/v1/dashboard/${path}`;
  const body = await request.text();

  try {
    const session = await getServerSession(authOptions);

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (session?.user && (session.user as any).token) {
      headers.set('Authorization', `Bearer ${(session.user as any).token}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[Dashboard Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send dashboard data' },
      { status: 500 }
    );
  }
}
