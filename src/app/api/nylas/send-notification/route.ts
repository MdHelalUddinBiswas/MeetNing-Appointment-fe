import { NextRequest, NextResponse } from 'next/server';

// This route handles sending email notifications about appointments
export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract notification data from request body
    const { event_id, participants, message } = await request.json();
    
    // Validate required fields
    if (!event_id || !participants || !participants.length) {
      return NextResponse.json({ 
        error: 'Missing required fields: event_id, participants' 
      }, { status: 400 });
    }
    
    // Call backend API to send notifications via Nylas
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nylas/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        event_id,
        participants,
        message
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to send notifications');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully'
    });
  } catch (error: any) {
    console.error('Notification sending error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
