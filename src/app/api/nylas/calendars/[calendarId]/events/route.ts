import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all events for a specific calendar
export async function GET(
  request: NextRequest,
  { params }: { params: { calendarId: string } }
) {
  try {
    const { calendarId } = params;
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 });
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    // Call backend API to get events from Nylas
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars/${calendarId}/events?start=${start}&end=${end}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch events');
    }
    
    return NextResponse.json(data.events);
  } catch (error: any) {
    console.error('Nylas events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new event in a calendar
export async function POST(
  request: NextRequest,
  { params }: { params: { calendarId: string } }
) {
  try {
    const { calendarId } = params;
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 });
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract event data from request body
    const eventData = await request.json();
    
    // Call backend API to create event through Nylas
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create event');
    }
    
    return NextResponse.json(data.event);
  } catch (error: any) {
    console.error('Nylas event creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
