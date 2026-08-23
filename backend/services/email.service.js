import nodemailer from 'nodemailer';

let cachedTransporter = null;
let transporterType = 'uninitialized';

/**
 * Mask an email for safe logging without exposing PII
 */
export const maskEmail = (email = '') => {
  if (!email || !email.includes('@')) return '***@***';
  const [name, domain] = email.split('@');
  const visible = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${visible}@${domain}`;
};

/**
 * Check if a string is missing or is an obvious placeholder
 */
const isPlaceholderCredential = (val) => {
  if (!val || typeof val !== 'string') return true;
  const lower = val.trim().toLowerCase();
  return (
    lower === '' ||
    lower.includes('your_email') ||
    lower.includes('your_app_password') ||
    lower.includes('your_') ||
    lower.includes('example.com') ||
    lower === 'xxx'
  );
};

/**
 * Get or initialize Nodemailer transporter and run verification
 */
export const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.MAIL_FROM;

  console.log('\n=================================');
  console.log('EMAIL SERVICE ENVIRONMENT CHECK:');
  console.log(`SMTP_HOST configured: ${!!host}`);
  console.log(`SMTP_PORT configured: ${!!port}`);
  console.log(`SMTP_USER configured: ${!isPlaceholderCredential(user)}`);
  console.log(`SMTP_PASS configured: ${!isPlaceholderCredential(pass)}`);
  console.log(`EMAIL_FROM configured: ${!!from}`);
  console.log('=================================\n');

  // 1. If SMTP credentials are provided, attempt to configure and verify
  if (host && !isPlaceholderCredential(user) && !isPlaceholderCredential(pass)) {
    const isSecure = port === 465;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.verify();
      console.log('=================================');
      console.log('SMTP VERIFY: SUCCESS');
      console.log('SMTP server is reachable and authenticated');
      console.log('=================================\n');
      cachedTransporter = transporter;
      transporterType = 'custom_smtp';
      return cachedTransporter;
    } catch (error) {
      console.error('=================================');
      console.error('SMTP VERIFY: FAILED');
      console.error('code:', error.code);
      console.error('message:', error.message);
      console.error('command:', error.command);
      console.error('responseCode:', error.responseCode);
      console.error('response:', error.response);
      console.error('=================================\n');
    }
  } else {
    console.log('=================================');
    console.log('SMTP VERIFY: SKIPPED (Placeholder or missing credentials in .env)');
    console.log('=================================\n');
  }

  // 2. Automatic Ethereal fallback for development
  try {
    console.log('[EMAIL SERVICE] Attempting Ethereal test inbox provisioning...');
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
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

    await etherealTransporter.verify();
    console.log('=================================');
    console.log('ETHEREAL SMTP VERIFY: SUCCESS');
    console.log(`Ethereal test mailbox provisioned: ${testAccount.user}`);
    console.log('=================================\n');
    cachedTransporter = etherealTransporter;
    transporterType = 'ethereal_test';
    return cachedTransporter;
  } catch (err) {
    console.error('ETHEREAL PROVISIONING FAILED:', err.message);
  }

  // 3. Console fallback
  console.log('[EMAIL SERVICE] Falling back to local console mock transport.');
  transporterType = 'console_fallback';
  cachedTransporter = {
    sendMail: async (mailOptions) => {
      console.log('\n================== [LOCAL CONSOLE EMAIL] ==================');
      console.log(`To: ${maskEmail(mailOptions.to)}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('===========================================================\n');
      return {
        messageId: `console-mock-${Date.now()}`,
        accepted: [mailOptions.to],
        rejected: [],
        response: '250 2.0.0 OK console-mock'
      };
    }
  };

  return cachedTransporter;
};

/**
 * Send Test Email (for diagnostic endpoint)
 */
export const sendTestEmail = async (toEmail) => {
  const recipient = toEmail.trim().toLowerCase();
  const transporter = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"TeamForge" <no-reply@teamforge.app>';

  const mailOptions = {
    from: fromAddress,
    to: recipient,
    subject: 'TeamForge Email Test',
    text: 'This is a TeamForge email delivery test.'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('\n=================================');
    console.log('EMAIL SEND RESULT:');
    console.log('messageId:', info.messageId);
    console.log('accepted:', info.accepted);
    console.log('rejected:', info.rejected);
    console.log('response:', info.response);
    console.log('=================================\n');

    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📬 [ETHEREAL PREVIEW]: ${previewUrl}`);
      }
    }

    return { success: true, info, transporterType };
  } catch (error) {
    console.error('=================================');
    console.error('EMAIL SEND FAILED:');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('command:', error.command);
    console.error('responseCode:', error.responseCode);
    console.error('response:', error.response);
    console.error('=================================\n');
    throw error;
  }
};

/**
 * Send 6-Digit Password Reset OTP Email
 */
export const sendPasswordResetEmail = async (toEmail, userName, otp) => {
  const recipient = toEmail.trim().toLowerCase();
  const transporter = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"TeamForge Security" <no-reply@teamforge.app>';

  const mailOptions = {
    from: fromAddress,
    to: recipient,
    subject: 'TeamForge — Password Reset Verification Code',
    text: `Hi ${userName || 'there'},

We received a request to reset your TeamForge account password.

Your 6-digit verification code is:

${otp}

This code expires in 10 minutes.

If you did not request this password reset, please ignore this email. Your account remains secure.

Regards,
TeamForge Security Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #150d10; color: #F6E8E2; padding: 36px 20px; border-radius: 20px; max-width: 520px; margin: 0 auto; border: 1px solid #703344;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F6E8E2; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Team<span style="color: #CB6B5A;">Forge</span></h1>
          <p style="color: #DDA081; font-size: 12px; margin-top: 4px; font-weight: 500;">Student Team & Project Collaboration Platform</p>
        </div>
        
        <div style="background-color: #281A21; border: 1px solid #703344; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <h2 style="margin-top: 0; color: #F6E8E2; font-size: 18px; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #DDA081; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Hi <strong>${userName || 'there'}</strong>,
          </p>
          <p style="color: #DDA081; font-size: 14px; line-height: 1.6;">
            We received a request to reset your TeamForge password. Use the 6-digit verification code below to verify your request:
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #CB6B5A; background-color: #150d10; padding: 14px 28px; border-radius: 14px; border: 2px solid #A84A4D; text-shadow: 0 0 12px rgba(203, 107, 90, 0.4); font-family: monospace;">
              ${otp}
            </span>
          </div>
          
          <p style="color: #CB6B5A; font-size: 12px; font-weight: 600; margin: 0; text-align: center;">
            ⏱ This code is valid for 10 minutes.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #703344; padding-top: 16px;">
          <p style="color: #DDA081; font-size: 11px; line-height: 1.5; margin: 0;">
            If you did not request this password reset, you can safely ignore this email. No changes will be made to your account.
          </p>
          <p style="color: #703344; font-size: 10px; margin-top: 8px;">
            © ${new Date().getFullYear()} TeamForge. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log('[OTP EMAIL] accepted:', info.accepted);
    console.log('[OTP EMAIL] rejected:', info.rejected);
    console.log('[OTP EMAIL] messageId:', info.messageId);
    console.log('[OTP EMAIL] response:', info.response);

    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n📬 [EMAIL PREVIEW URL] View Ethereal Web Email: ${previewUrl}\n`);
      }
    }

    return {
      success: true,
      info,
      transporterType
    };
  } catch (error) {
    console.error('[OTP EMAIL FAILED]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('command:', error.command);
    console.error('responseCode:', error.responseCode);
    console.error('response:', error.response);

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};
