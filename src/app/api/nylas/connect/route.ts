import { NextRequest, NextResponse } from 'next/server';

// This route handles initiating the Nylas OAuth process
export async function POST(request: NextRequest) {
  try {
    // Extract provider type from request body
    const { provider } = await request.json();
    const validProviders = ['google', 'outlook', 'exchange'];
    
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Call backend API to initiate Nylas OAuth flow
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nylas/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ provider })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to connect to Nylas');
    }
    
    // Return the OAuth URL to redirect the user to
    return NextResponse.json({
      authUrl: data.authUrl
    });
  } catch (error: any) {
    console.error('Nylas connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
