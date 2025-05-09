import { NextRequest, NextResponse } from 'next/server';

// This route handles getting all calendars for a user from Nylas
export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Call backend API to get calendars from Nylas
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nylas/calendars`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch calendars');
    }
    
    return NextResponse.json(data.calendars);
  } catch (error: any) {
    console.error('Nylas calendars error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
