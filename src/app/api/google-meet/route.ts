import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Extract the Google OAuth token and event details from the request
    const { accessToken, eventDetails } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
    }
    
    // Instead of making a direct call to Google APIs, pass the request to our backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL + '/google-meet';
    
    // Forward the request to our backend API
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        eventDetails,
      }),
    });
    
    // Parse the response from our backend
    const data = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      console.error('Backend API error:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to create Google Meet' },
        { status: response.status }
      );
    }

    // Return the Google Meet link from the backend response
    return NextResponse.json({ meetLink: data.meetLink });
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return NextResponse.json({ error: 'Failed to create Google Meet' }, { status: 500 });
  }
}
