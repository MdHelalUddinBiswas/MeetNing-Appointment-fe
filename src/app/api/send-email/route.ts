
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, appointmentTitle, startTime, location } = await request.json();
console.log(to, subject, appointmentTitle, startTime, location);
    const data = await resend.emails.send({
      from: 'mdhelal6775@gmail.com', // Use a validated sender
      to: to,
      subject: subject,
      html: `
        <h1>You've been added to an appointment</h1>
        <p>You have been added to the following appointment:</p>
        <p><strong>Title:</strong> ${appointmentTitle}</p>
        <p><strong>When:</strong> ${new Date(startTime).toLocaleString()}</p>
        <p><strong>Location:</strong> ${location || 'Not specified'}</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
