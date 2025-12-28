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
  const url = `${BACKEND_URL}/api/v1/admin/${path}${request.nextUrl.search}`;

  try {
    // Get NextAuth session to extract backend token
    const session = await getServerSession(authOptions);
    console.log('[Proxy] Session:', {
      hasSession: !!session,
      hasToken: !!(session?.user as any)?.token,
    });

    // Forward all headers including cookies
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Add Authorization header with backend JWT token from NextAuth session
    if (session?.user && (session.user as any).token) {
      headers.set('Authorization', `Bearer ${(session.user as any).token}`);
      console.log('[Proxy] Added Authorization header with token');
    } else {
      console.log('[Proxy] No token found in session');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    console.log('[Proxy] Backend response:', {
      status: response.status,
      success: data.success,
    });

    // Forward response headers including Set-Cookie
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch data from backend' },
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
  const url = `${BACKEND_URL}/api/v1/admin/${path}`;
  const body = await request.text();

  try {
    // Get NextAuth session to extract backend token
    const session = await getServerSession(authOptions);

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Add Authorization header with backend JWT token
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
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send data to backend' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const url = `${BACKEND_URL}/api/v1/admin/${path}`;
  const body = await request.text();

  try {
    // Get NextAuth session to extract backend token
    const session = await getServerSession(authOptions);

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Add Authorization header with backend JWT token
    if (session?.user && (session.user as any).token) {
      headers.set('Authorization', `Bearer ${(session.user as any).token}`);
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update data on backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const url = `${BACKEND_URL}/api/v1/admin/${path}`;

  try {
    // Get NextAuth session to extract backend token
    const session = await getServerSession(authOptions);

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Add Authorization header with backend JWT token
    if (session?.user && (session.user as any).token) {
      headers.set('Authorization', `Bearer ${(session.user as any).token}`);
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete data from backend' },
      { status: 500 }
    );
  }
}
