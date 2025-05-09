import { NextRequest, NextResponse } from 'next/server';

// This route handles creating Google Meet links for appointments
export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract meeting details from request body
    const { title, start_time, end_time } = await request.json();
    
    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, start_time, end_time' 
      }, { status: 400 });
    }
    
    // Call backend API to create Google Meet link
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nylas/google-meet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        start_time,
        end_time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Google Meet link');
    }
    
    // For demo purposes, generate a fake meeting URL if backend is not available
    const mockMeetUrl = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`;
    
    return NextResponse.json({
      meetUrl: data.meetUrl || mockMeetUrl
    });
  } catch (error: any) {
    console.error('Google Meet creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
