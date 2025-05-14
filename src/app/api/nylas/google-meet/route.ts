import { NextRequest, NextResponse } from 'next/server';

// This route handles creating Google Meet links for appointments
export async function POST(request: NextRequest) {
  try {
    console.log('Google Meet API route called');
    
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract meeting details from request body
    const requestBody = await request.json();
    const { 
      title, 
      start_time, 
      end_time, 
      access_token, // Get Google OAuth access token
      participants 
    } = requestBody;
    
    console.log('Request received with:', { 
      hasTitle: !!title, 
      hasStartTime: !!start_time, 
      hasEndTime: !!end_time,
      hasAccessToken: !!access_token,
      participantCount: participants?.length || 0 
    });
    
    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, start_time, end_time' 
      }, { status: 400 });
    }
    
    // Check if we have Google access token (required for Google Meet creation)
    if (!access_token) {
      console.log('No access token provided - generating mock meet URL');
      // For demo purposes, generate a fake meeting URL
      const mockMeetUrl = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`;
      return NextResponse.json({
        meetUrl: mockMeetUrl,
        isMock: true
      });
    }
    
    // Create event object for Google Calendar API
    const eventDetails = {
      summary: title,
      start: {
        dateTime: start_time,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end_time,
        timeZone: 'UTC'
      },
      attendees: participants ? participants.map((email: string) => ({ email })) : [],
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };
    
    console.log('Attempting direct Google Calendar API call');
    
    // Use direct Google Calendar API
    try {
      // Create event with conferencing
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventDetails)
      });
      
      // Check if not JSON response (HTML error page)
      const contentType = calendarResponse.headers.get('content-type');
      console.log('Google API response content type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await calendarResponse.text();
        console.error('Non-JSON response from Google API:', textResponse.substring(0, 200));
        throw new Error('Invalid response from Google API');
      }
      
      const calendarData = await calendarResponse.json();
      
      if (!calendarResponse.ok) {
        console.error('Google Calendar API error:', calendarData);
        throw new Error(calendarData.error?.message || 'Failed to create Google Meet');
      }
      
      // Extract meet link
      const meetLink = calendarData.hangoutLink || 
                      calendarData.conferenceData?.entryPoints?.find((ep: any) => ep.uri)?.uri;
      
      if (!meetLink) {
        throw new Error('No Google Meet link in response');
      }
      
      console.log('Successfully created Google Meet:', meetLink);
      
      return NextResponse.json({
        meetUrl: meetLink,
        eventId: calendarData.id
      });
    } catch (googleError: any) {
      console.error('Google Calendar API error:', googleError);
      
      // Fallback to mock URL
      const mockMeetUrl = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`;
      return NextResponse.json({
        meetUrl: mockMeetUrl,
        isMock: true,
        error: googleError.message || 'Failed to create Google Meet'
      });
    }
  } catch (error: any) {
    console.error('Google Meet creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
