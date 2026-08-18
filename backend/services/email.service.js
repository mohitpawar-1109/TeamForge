import nodemailer from 'nodemailer';

let cachedTransporter = null;

// Initialize or return nodemailer transporter
const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Development fallback transporter
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (err) {
      cachedTransporter = null;
    }
  }

  if (!cachedTransporter) {
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        console.log('\n================== [OUTGOING EMAIL] ==================');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Text:\n${mailOptions.text}`);
        console.log('======================================================\n');
        return { messageId: `console-mock-${Date.now()}` };
      }
    };
  }

  return cachedTransporter;
};

/**
 * Send 6-Digit Password Reset OTP Email
 * @param {string} toEmail 
 * @param {string} userName 
 * @param {string} otp 
 */
export const sendPasswordResetEmail = async (toEmail, userName, otp) => {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"TeamForge Security" <no-reply@teamforge.app>';

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: 'TeamForge Password Reset OTP',
      text: `Hi ${userName || 'there'},

We received a request to reset your TeamForge password.

Your verification code is:

${otp}

This code expires in 10 minutes.

If you did not request this, you can safely ignore this email.

Regards,
TeamForge Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090B; color: #FAFAFA; padding: 32px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #27272A;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6366F1; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TeamForge</h2>
            <p style="color: #A1A1AA; font-size: 12px; margin-top: 4px;">Student Team & Project Collaboration Platform</p>
          </div>
          
          <div style="background-color: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; color: #FFFFFF; font-size: 16px;">Password Reset Request</h3>
            <p style="color: #D4D4D8; font-size: 14px; line-height: 1.5;">Hi <strong>${userName || 'there'}</strong>,</p>
            <p style="color: #A1A1AA; font-size: 14px; line-height: 1.5;">We received a request to reset your TeamForge account password. Use the 6-digit verification code below to proceed:</p>
            
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #818CF8; background-color: #111113; padding: 12px 24px; border-radius: 12px; border: 1px solid #3730A3;">${otp}</span>
            </div>
            
            <p style="color: #F43F5E; font-size: 12px; margin: 0; text-align: center;">⏱ This code expires in 10 minutes.</p>
          </div>
          
          <p style="color: #71717A; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            If you did not request a password reset, please ignore this email or reach out to support.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email Service] Ethereal Preview URL: ${previewUrl}`);
      }
    }
    return { success: true, messageId: info?.messageId };
  } catch (error) {
    console.error('[Email Service Error]:', error);
    // Return gracefully so the API doesn't fail catastrophically
    return { success: false, error: error.message };
  }
};
