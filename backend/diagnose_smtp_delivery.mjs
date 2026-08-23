import dotenv from 'dotenv';
import { sendTestEmail, sendPasswordResetEmail, getTransporter } from './services/email.service.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runSmtpDiagnostics() {
  console.log('==================================================');
  console.log('🔍 TEAMFORGE EMAIL PIPELINE & SMTP DIAGNOSTICS');
  console.log('==================================================\n');

  // STEP 3 Check: Environment variables
  console.log('STEP 3 — ENVIRONMENT VARIABLE AUDIT:');
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.MAIL_FROM;

  console.log(`SMTP_HOST configured: ${!!host}`);
  console.log(`SMTP_PORT configured: ${!!port}`);
  console.log(`SMTP_USER configured: ${!!user && !user.includes('your_email')}`);
  console.log(`SMTP_PASS configured: ${!!pass && !pass.includes('your_app_password')}`);
  console.log(`EMAIL_FROM configured: ${!!from}\n`);

  // STEP 2 & 4 Check: Initialize and Verify Transporter Directly
  console.log('STEP 2 & 4 — DIRECT TRANSPORTER VERIFICATION & TEST EMAIL DISPATCH:');
  try {
    const testResult = await sendTestEmail('user_test@domain.com');
    console.log('✅ sendTestEmail SUCCESS:');
    console.log('Transporter Type:', testResult.transporterType);
    console.log('Message ID:', testResult.info.messageId);
    console.log('Accepted:', testResult.info.accepted);
    console.log('Rejected:', testResult.info.rejected);
    console.log('Response:', testResult.info.response);
  } catch (err) {
    console.error('❌ sendTestEmail FAILED:');
    console.error('code:', err.code);
    console.error('message:', err.message);
    console.error('command:', err.command);
    console.error('responseCode:', err.responseCode);
    console.error('response:', err.response);
  }

  // STEP 6 Check: Test sendPasswordResetEmail directly
  console.log('\nSTEP 6 — PASSWORD RESET OTP EMAIL SEND TEST:');
  try {
    const otpResult = await sendPasswordResetEmail('student@university.edu', 'Mohit Pawar', '482910');
    console.log('✅ sendPasswordResetEmail Result:', otpResult.success ? 'SUCCESS' : 'FAILED');
    if (otpResult.success) {
      console.log('Transporter Type:', otpResult.transporterType);
      console.log('Accepted:', otpResult.info.accepted);
      console.log('Rejected:', otpResult.info.rejected);
      console.log('Message ID:', otpResult.info.messageId);
      console.log('Response:', otpResult.info.response);
    } else {
      console.error('Error:', otpResult.error);
    }
  } catch (err) {
    console.error('❌ sendPasswordResetEmail FAILED:', err.message);
  }

  console.log('\n==================================================');
  console.log('✅ ALL DIAGNOSTICS COMPLETE');
  console.log('==================================================\n');
}

runSmtpDiagnostics();
