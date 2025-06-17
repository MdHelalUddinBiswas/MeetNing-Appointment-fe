
import { NextResponse } from 'next/server';
import { sendAppointmentInvitation } from '@/lib/email-utils';

// Audience ID to exclude from email notifications
const EXCLUDED_AUDIENCE_ID = 'a2ed616b-38ea-40ac-b216-c6c169d03410';

export async function POST(request: Request) {
  try {
    const { to, fromName, subject, appointmentTitle, startTime, endTime, location, description, addedAt, timezone } = await request.json();
    console.log('Email request:', { to, fromName, subject, appointmentTitle, startTime, location, addedAt, timezone });
    
    // Skip sending email if the recipient's email contains the excluded audience ID
    if (to && to.includes(EXCLUDED_AUDIENCE_ID)) {
      console.log('Skipping email for excluded audience ID:', EXCLUDED_AUDIENCE_ID);
      return NextResponse.json({ success: true, skipped: true, message: 'Email skipped for excluded audience' });
    }
    
    // Use our new email utility to send the appointment invitation
    const result = await sendAppointmentInvitation({
      to,
      fromName, // Pass the sender's name
      subject,
      appointmentTitle,
      startTime,
      endTime,
      location,
      description,
      addedAt,
      timezone,
    });
    
    if (result.success) {
      console.log('Email sent successfully');
      return NextResponse.json({ success: true, data: result.data });
    } else {
      console.error('Failed to send email:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to send email';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { name: error.name, stack: error.stack };
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error;
    }
    
    console.error('Detailed error:', { message: errorMessage, details: errorDetails });
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}
