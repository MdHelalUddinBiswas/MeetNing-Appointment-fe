import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch a specific event by ID
export async function GET(
  request: NextRequest,
  context: { params: { calendarId: string; eventId: string } }
) {
  try {
    const { calendarId, eventId } = params;
    if (!calendarId || !eventId) {
      return NextResponse.json({ error: 'Calendar ID and Event ID are required' }, { status: 400 });
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Call backend API to get the specific event from Nylas
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars/${calendarId}/events/${eventId}`,
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
      throw new Error(data.message || 'Failed to fetch event');
    }
    
    return NextResponse.json(data.event);
  } catch (error: any) {
    console.error('Nylas event fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing event
export async function PUT(
  request: NextRequest,
  { params }: { params: { calendarId: string; eventId: string } }
) {
  try {
    const { calendarId, eventId } = params;
    if (!calendarId || !eventId) {
      return NextResponse.json({ error: 'Calendar ID and Event ID are required' }, { status: 400 });
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract event update data from request body
    const eventUpdateData = await request.json();
    
    // Call backend API to update event through Nylas
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventUpdateData)
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update event');
    }
    
    return NextResponse.json(data.event);
  } catch (error: any) {
    console.error('Nylas event update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { calendarId: string; eventId: string } }
) {
  try {
    const { calendarId, eventId } = params;
    if (!calendarId || !eventId) {
      return NextResponse.json({ error: 'Calendar ID and Event ID are required' }, { status: 400 });
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Call backend API to delete event through Nylas
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete event');
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Nylas event deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
