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
  subject: string;
  appointmentTitle: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  addedAt?: string;
}

export const sendAppointmentInvitation = async (options: AppointmentEmailOptions) => {
  const { 
    to, 
    subject, 
    appointmentTitle, 
    startTime, 
    endTime, 
    location = "Not specified", 
    description = "",
    addedAt 
  } = options;


  // Format the added time nicely
  const formattedAddedTime = addedAt ? new Date(addedAt).toLocaleString() : 'Just now';
  
  // Calculate duration in minutes
  const durationMinutes = startTime && endTime ? 
    Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000) : 
    60; // Default to 60 minutes if not specified

  // Create email HTML content with a more professional design
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Invitation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
          }
          .content {
            padding: 20px 0;
          }
          .appointment-details {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            font-size: 12px;
            color: #888;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .added-time {
            font-size: 12px;
            color: #666;
            font-style: italic;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>You've Been Added to an Appointment</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been added to the following appointment:</p>
            <div class="appointment-details">
              <p><strong>Title:</strong> ${appointmentTitle}</p>
              <p><strong>When:</strong> ${new Date(startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
              <p><strong>Location:</strong> ${location}</p>
              ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            </div>
            <p>You can view the appointment details in your MeetNing dashboard.</p>
            <p class="added-time">You were added to this appointment on ${formattedAddedTime}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MeetNing. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Add plain text version for better deliverability
  const textContent = `
    You've Been Added to an Appointment
    
    Hello,
    
    You have been added to the following appointment:
    
    Title: ${appointmentTitle}
    When: ${new Date(startTime).toLocaleString()}
    Duration: ${durationMinutes} minutes
    Location: ${location}
    ${description ? `Description: ${description}` : ''}
    
    You can view the appointment details in your MeetNing dashboard.
    
    You were added to this appointment on ${formattedAddedTime}
    
    © ${new Date().getFullYear()} MeetNing. All rights reserved.
  `;

  const mailOptions = {
    from: `"MeetNing" <${process.env.EMAIL_USER}||"helal@nexstack.sg">`,
    to: to, // In dev, send to ourselves
    subject: subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    console.log(`🔄 Attempting to send appointment invitation email to ${to}...`);
    
    // Test SMTP connection before sending if using real transport
    if (hasSmtpCredentials) {
      try {
        await transporter.verify();
        console.log("✅ SMTP connection verified successfully");
      } catch (verifyError) {
        console.error("❌ SMTP connection verification failed:", verifyError);
        // Continue anyway to see the specific sending error
      }
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error: any) {
    console.error("❌ Error sending appointment invitation email:", error);
    // Log detailed error information
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.command) console.error(`Failed command: ${error.command}`);
    if (error.response) console.error(`Server response: ${error.response}`);
    return { success: false, error: error.message };
  }
};

export default transporter;
