import { NextRequest, NextResponse } from 'next/server';

// This route handles finding available meeting times using Nylas
export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract availability request data
    const {
      participants,
      duration_minutes,
      start_time,
      end_time,
      timezones
    } = await request.json();
    
    // Validate required fields
    if (!participants || !participants.length || !duration_minutes || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: participants, duration_minutes, start_time, end_time' 
      }, { status: 400 });
    }
    
    // Call backend API to get availability from Nylas
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nylas/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        participants,
        duration_minutes,
        start_time,
        end_time,
        timezones
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to find available times');
    }
    
    return NextResponse.json(data.availability);
  } catch (error: any) {
    console.error('Nylas availability error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
