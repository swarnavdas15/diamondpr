import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || 'amarchattaraj@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Diamond Flange ERP <noreply@flangeerp.com>';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

export const sendOtpEmail = async (toEmail: string, otpCode: string, userName: string = 'Valued User') => {
  const transporter = createTransporter();

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Recovery OTP - Diamond Flange ERP</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 28px; border: 1px solid #334155; }
        .logo-row { font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 10px; }
        .text { font-size: 14px; color: #cbd5e1; line-height: 1.6; }
        .otp-box { background-color: #0f172a; border: 2px solid #38bdf8; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .otp-code { font-size: 32px; font-weight: 900; color: #38bdf8; letter-spacing: 8px; margin: 8px 0; }
        .warning { font-size: 12px; color: #f59e0b; font-weight: 700; }
        .footer { font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #334155; padding-top: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-row">❖ DIAMOND FLANGE ERP</div>
        <div class="title">Password Reset Verification Code</div>
        <div class="text">
          Hello <strong>${userName}</strong>,<br><br>
          We received a request to reset your password for your Diamond Flange ERP account linked to <strong>${toEmail}</strong>.
        </div>
        <div class="otp-box">
          <div class="otp-label">Your One-Time Password (OTP)</div>
          <div class="otp-code">${otpCode}</div>
          <div class="warning">⏱ Valid for 5 minutes. Do NOT share this code with anyone.</div>
        </div>
        <div class="text">
          Enter this 6-digit verification code in the ERP Password Recovery screen to proceed with creating your new password.
        </div>
        <div class="footer">
          If you did not request a password reset, please ignore this email or contact Super Admin immediately.<br>
          © 2026 Diamond Flange Pvt Ltd. Industrial ERP System.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: `Diamond Flange ERP - Password Recovery OTP Code [${otpCode}]`,
      text: `Your Diamond Flange ERP password recovery OTP is: ${otpCode}. It expires in 5 minutes.`,
      html: htmlTemplate,
    });

    console.log(`✉️ Real OTP Email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Failed to send real OTP email to ${toEmail}:`, error.message);
    // Return graceful fallback notice if SMTP server requires app password configuration
    return { success: false, error: error.message };
  }
};
