#!/usr/bin/env tsx
/**
 * Send email notification when import fails
 * Used by GitHub Actions workflow
 */

import { Resend } from 'resend';

// Parse command line arguments
const args = process.argv.slice(2);
const runIdArg = args.find(arg => arg.startsWith('--runId='));
const errorsArg = args.find(arg => arg.startsWith('--errors='));

const runId = runIdArg ? runIdArg.split('=')[1] : 'unknown';
const errorCount = errorsArg ? errorsArg.split('=')[1] : '0';

async function sendFailureNotification() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.log('Email notification skipped - missing RESEND configuration');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL,
      subject: '🚨 Round Table Import Failed',
      html: `
        <h2>Vehicle Import Failure Alert</h2>
        
        <p>The daily inventory import has failed and requires your attention.</p>
        
        <h3>Details:</h3>
        <ul>
          <li><strong>Run ID:</strong> ${runId}</li>
          <li><strong>Date:</strong> ${new Date().toISOString()}</li>
          <li><strong>Errors:</strong> ${errorCount}</li>
        </ul>
        
        <h3>Actions:</h3>
        <ol>
          <li><a href="https://github.com/${process.env.GITHUB_REPOSITORY || 'your-org/faRoundTable'}/actions/runs/${runId}">View workflow logs</a></li>
          <li>Check SFTP connectivity and credentials</li>
          <li>Verify dealership CSV file mappings</li>
          <li>Review import report artifact for details</li>
        </ol>
        
        <p style="color: #666; font-size: 12px;">
          This is an automated message from Round Table Import System.
        </p>
      `
    });

    console.log('✅ Failure notification email sent');
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

sendFailureNotification();