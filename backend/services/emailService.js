const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter based on .env configuration
 */
function createTransporter() {
  // 1. Custom SMTP Server
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 2. Gmail with App Password
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
}

/**
 * Send 6-digit OTP verification email
 */
async function sendEmailOtp({ email, otp, studentName, regNo }) {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0f172a, #1d4ed8); color: white; padding: 30px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; color: #93c5fd; font-size: 13px; }
        .content { padding: 32px 28px; color: #334155; }
        .greeting { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
        .otp-box { background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #1d4ed8; margin: 10px 0; font-family: monospace; }
        .otp-expiry { font-size: 12px; color: #dc2626; font-weight: 600; }
        .student-info { background: #eff6ff; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin: 18px 0; }
        .student-info p { margin: 4px 0; color: #1e40af; }
        .security-notice { font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🎓 VIGNAN UNIVERSITY</h1>
          <p>Office of the Registrar & Student Credential Verification</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${studentName || "Student"}!</div>
          <p>A request was received to verify your Student Identity Card. Use the one-time verification code below to authorize access:</p>
          
          <div class="otp-box">
            <div class="otp-label">Your One-Time Password (OTP)</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">⏱️ Expires in 5 minutes</div>
          </div>

          <div class="student-info">
            <p><strong>Registration Number:</strong> ${regNo}</p>
            <p><strong>Institution:</strong> Vignan's Foundation for Science, Technology & Research</p>
          </div>

          <div class="security-notice">
            🔒 <strong>Security Warning:</strong> Never share this OTP with anyone, including university staff. If you did not initiate this verification, please contact the IT Helpdesk immediately.
          </div>
        </div>
        <div class="footer">
          © Vignan University | Student ID Verification System | Automated System - Do Not Reply
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "noreply@vignan.ac.in";
      const info = await transporter.sendMail({
        from: `"Vignan University Verification" <${fromAddress}>`,
        to: email,
        subject: `[Vignan University] ${otp} is your Student ID Verification OTP`,
        text: `Your Vignan University Student ID verification OTP is: ${otp}. It is valid for 5 minutes. Do not share this code.`,
        html: htmlContent,
      });

      console.log(`[Email Service] Live OTP email dispatched to ${email}. MessageId: ${info.messageId}`);
      return { success: true, provider: "Nodemailer", messageId: info.messageId };
    } catch (err) {
      console.error("Nodemailer dispatch error:", err.message);
      return { success: false, provider: "Nodemailer", error: err.message };
    }
  }

  // Fallback when SMTP is not configured in .env
  console.log("----------------------------------------------------------------");
  console.log(`[Email Gateway Notice] No SMTP credentials found in backend/.env`);
  console.log(`Target Email: ${email}`);
  console.log(`Generated OTP: ${otp}`);
  console.log(`Student: ${studentName} (${regNo})`);
  console.log(`To enable live emails, configure SMTP_* or GMAIL_* in backend/.env`);
  console.log("----------------------------------------------------------------");

  return {
    success: true,
    provider: "ConsoleLogger",
    simulated: true,
    message: "Email credentials not configured in .env. OTP logged to server console.",
  };
}

module.exports = { sendEmailOtp };

