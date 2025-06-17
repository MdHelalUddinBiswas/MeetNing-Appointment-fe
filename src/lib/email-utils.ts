import nodemailer from "nodemailer";

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

// Configure email transporter
let transporter: nodemailer.Transporter | any;

// Check if SMTP credentials are provided
const hasSmtpCredentials = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASSWORD;

if (!hasSmtpCredentials) {
  console.log("⚠ NO EMAIL CREDENTIALS FOUND - emails will not be sent");
  console.log("⚠ To send actual emails, configure EMAIL_USER and EMAIL_PASSWORD in your .env file");

  // Create a mock transporter that just logs emails
  transporter = {
    sendMail: async (mailOptions: any) => {
      console.log("\n====== MOCK EMAIL SENT ======");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("Email Content Preview:", mailOptions.html?.substring(0, 150) + "...");
      console.log("==============================\n");
      return { 
        messageId: `mock-email-${Date.now()}@meetning.app`,
        accepted: [mailOptions.to],
        rejected: [],
        response: '250 Message accepted'
      };
    },
  } as any;
} else {
  console.log("📧 Setting up real email transporter with:");
  console.log(`- User: ${process.env.EMAIL_USER}`);
  console.log(`- Host: smtp.gmail.com`);

  // Use real email transporter with provided credentials
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS - set to false for port 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
}

interface AppointmentEmailOptions {
  to: string;
  fromName: string; // Added sender's name for a personal touch
  subject: string;
  appointmentTitle: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  addedAt?: string;
  timezone?: string;
}

export const sendAppointmentInvitation = async (options: AppointmentEmailOptions) => {
  const { 
    to, 
    fromName,
    subject, 
    appointmentTitle, 
    startTime, 
    endTime, 
    location = "Not specified", 
    description = "",
    addedAt,
    timezone
  } = options;

  // Calculate duration in minutes
  const durationMinutes = startTime && endTime ? 
    Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000) : 
    60; // Default to 60 minutes if not specified

  // Format start time for readability
  const formattedStartTime = new Date(startTime).toLocaleString('en-US', { 
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // Create email HTML content with a more personal and modern design
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .container { padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; }
          .header { text-align: center; padding-bottom: 15px; }
          .header h2 { font-size: 24px; color: #222; margin: 0; }
          .content { padding: 10px 0; }
          .content p { margin: 0 0 15px; }
          .appointment-details { background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
          .footer { font-size: 12px; color: #888; text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: 20px; }
          .closing { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${appointmentTitle}</h2>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>I hope you're doing well. I’d like to invite you to join me for the event above.</p>
            ${description ? `<p>We'll be discussing: ${description}</p>` : ''}
            
            <div class="appointment-details">
              <p><strong>When:</strong> ${formattedStartTime} (${timezone})</p>
              <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
              <p><strong>Location:</strong> ${location}</p>
            </div>

            <p class="closing">Please let me know if you can make it. Looking forward to connecting!</p>
            <p>Best regards,<br>${fromName}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MeetNing. All rights reserved.</p>
            <p>This invitation was sent by ${fromName} via MeetNing.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Add plain text version for better deliverability
  const textContent = `
    Subject: ${subject}

    Hi there,

    I hope you're doing well. I’d like to invite you to join me for "${appointmentTitle}".

    ${description ? `We'll be discussing: ${description}\n` : ''}
    
    Here are the details:
    - When: ${formattedStartTime} (${timezone})
    - Duration: ${durationMinutes} minutes
    - Location: ${location}

    Please let me know if you can make it. Looking forward to connecting!

    Best regards,
    ${fromName}

    ---
    © ${new Date().getFullYear()} MeetNing. All rights reserved.
    This invitation was sent by ${fromName} via MeetNing.
  `;

  const mailOptions = {
    from: `"${fromName} via MeetNing" <${process.env.EMAIL_USER || "helal@nexstack.sg"}>`,
    to: to,
    subject: subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    console.log(`🔄 Attempting to send appointment invitation email to ${to}...`);
    
    if (hasSmtpCredentials) {
      try {
        await transporter.verify();
        console.log("✅ SMTP connection verified successfully");
      } catch (verifyError) {
        console.error("❌ SMTP connection verification failed:", verifyError);
      }
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error: any) {
    console.error("❌ Error sending appointment invitation email:", error);
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.command) console.error(`Failed command: ${error.command}`);
    if (error.response) console.error(`Server response: ${error.response}`);
    return { success: false, error: error.message };
  }

};

export default transporter;
