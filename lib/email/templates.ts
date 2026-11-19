/**
 * MS Backstage — Branded Email Templates
 *
 * All HTML templates use clean inline styling, accessible typography,
 * responsive table layouts, safe HTML escaping, and plain-text alternatives.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_HEADER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
    <tr>
      <td>
        <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          MS Backstage
        </span>
        <span style="display: block; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; font-family: sans-serif;">
          Event Operations Platform
        </span>
      </td>
    </tr>
  </table>
`;

const EMAIL_FOOTER = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; font-family: sans-serif; font-size: 12px; color: #64748b;">
    <tr>
      <td>
        <p style="margin: 0 0 4px 0;">This is an automated notification from MS Backstage.</p>
        <p style="margin: 0;">Please do not reply directly to this message. For support, contact your event administrator.</p>
      </td>
    </tr>
  </table>
`;

/**
 * 1. Organization Invitation Email Template
 */
export function invitationTemplate(params: {
  organizationName: string;
  role: string;
  inviteUrl: string;
  recipientEmail: string;
  expiresInDays?: number;
}): { subject: string; html: string; text: string } {
  const orgName = escapeHtml(params.organizationName);
  const roleTitle = escapeHtml(params.role.replace('_', ' ').toUpperCase());
  const inviteUrl = escapeHtml(params.inviteUrl);
  const days = params.expiresInDays || 7;

  const subject = `Invitation to join ${params.organizationName} on MS Backstage`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">You've been invited!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              You have been invited to join <strong>${orgName}</strong> on MS Backstage as an <strong>${roleTitle}</strong>.
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
              This invitation link is valid for ${days} days. If you were not expecting this invitation, you can safely ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 11px; word-break: break-all; margin: 12px 0 0 0;">
              Direct link: ${inviteUrl}
            </p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
You have been invited to join ${params.organizationName} on MS Backstage as a ${roleTitle}.

To accept this invitation, open the link below:
${params.inviteUrl}

This invitation link is valid for ${days} days.
If you were not expecting this invitation, you can safely ignore this email.
  `.trim();

  return { subject, html, text };
}

/**
 * 2. Password Reset Email Template
 */
export function passwordResetTemplate(params: {
  resetUrl: string;
  recipientEmail: string;
}): { subject: string; html: string; text: string } {
  const resetUrl = escapeHtml(params.resetUrl);
  const subject = `Reset your MS Backstage password`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Password Reset Request</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password for your MS Backstage account. Click the button below to set a new password:
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
              This link is single-use and will expire in 1 hour. If you did not request a password reset, no action is needed and your account remains secure.
            </p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

We received a request to reset your password for your MS Backstage account.
To reset your password, visit the link below:
${params.resetUrl}

This link is single-use and expires in 1 hour.
If you did not request this, please disregard this email.
  `.trim();

  return { subject, html, text };
}

/**
 * 3. Attendee Registration Confirmation Template
 */
export function attendeeConfirmationTemplate(params: {
  eventName: string;
  attendeeName: string;
  registrationNumber: string;
  category: string;
}): { subject: string; html: string; text: string } {
  const eventName = escapeHtml(params.eventName);
  const attendeeName = escapeHtml(params.attendeeName);
  const regNumber = escapeHtml(params.registrationNumber);
  const category = escapeHtml(params.category);
  const subject = `Registration Confirmed: ${params.eventName} (${params.registrationNumber})`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Registration Confirmed</h2>
            <p style="color: #334155; font-size: 14px; margin: 0 0 20px 0;">Dear ${attendeeName}, your registration for <strong>${eventName}</strong> has been successfully recorded.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table width="100%" style="font-size: 13px; color: #334155;">
                <tr><td style="color: #64748b; padding: 4px 0;">Registration Number:</td><td style="font-weight: 600;">${regNumber}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Category:</td><td style="font-weight: 600;">${category}</td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">Please keep this registration number handy during badge pickup and spot check-in at the venue desk.</p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Registration Confirmed for ${params.eventName}

Dear ${params.attendeeName},
Your registration has been confirmed:
- Registration Number: ${params.registrationNumber}
- Category: ${params.category}

Please present your registration number at the registration desk.
  `.trim();

  return { subject, html, text };
}

/**
 * 4. Payment Receipt Template
 */
export function paymentReceiptTemplate(params: {
  eventName: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  attendeeName: string;
}): { subject: string; html: string; text: string } {
  const eventName = escapeHtml(params.eventName);
  const attendeeName = escapeHtml(params.attendeeName);
  const orderId = escapeHtml(params.orderId);
  const paymentId = escapeHtml(params.paymentId);
  const formattedAmount = `${params.currency.toUpperCase()} ${(params.amount / 100).toFixed(2)}`;
  const subject = `Payment Receipt: ${formattedAmount} for ${params.eventName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Payment Successful</h2>
            <p style="color: #334155; font-size: 14px; margin: 0 0 20px 0;">Thank you, ${attendeeName}. We have received your payment for <strong>${eventName}</strong>.</p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table width="100%" style="font-size: 13px; color: #166534;">
                <tr><td>Amount Paid:</td><td style="font-weight: 700; font-size: 16px;">${formattedAmount}</td></tr>
                <tr><td>Payment Reference:</td><td style="font-family: monospace;">${paymentId}</td></tr>
                <tr><td>Order ID:</td><td style="font-family: monospace;">${orderId}</td></tr>
              </table>
            </div>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Payment Receipt for ${params.eventName}
Amount: ${formattedAmount}
Payment ID: ${params.paymentId}
Order ID: ${params.orderId}
Status: Successful
  `.trim();

  return { subject, html, text };
}

/**
 * 5. Account Security Alert Template
 */
export function securityAlertTemplate(params: {
  action: string;
  recipientEmail: string;
  timestamp: string;
}): { subject: string; html: string; text: string } {
  const action = escapeHtml(params.action);
  const timestamp = escapeHtml(params.timestamp);
  const subject = `Security Alert: ${params.action} on your MS Backstage account`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #b91c1c; font-size: 18px; font-weight: 600;">Security Notification</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              The following security event occurred on your account at <strong>${timestamp}</strong>:
            </p>
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 14px; color: #991b1b; font-size: 13px; font-weight: 500;">
              ${action}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 20px 0 0 0;">
              If this was you, no action is needed. If you did not initiate this change, please sign in and change your password immediately.
            </p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Security Notification: ${params.action}
Time: ${params.timestamp}

If this was not you, please sign in and change your password immediately.
  `.trim();

  return { subject, html, text };
}

/**
 * 6. Email OTP Verification Template (Section 24)
 */
export function otpVerificationTemplate(params: {
  otp: string;
  recipientEmail: string;
  expiresInMinutes?: number;
}): { subject: string; html: string; text: string } {
  const otp = escapeHtml(params.otp);
  const minutes = params.expiresInMinutes || 5;
  const subject = `Your MS Backstage Verification Code: ${params.otp}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Verify your email address</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for registering with MS Backstage. Use the six-digit verification code below to complete your account setup:
            </p>
            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b; display: inline-block;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
              <strong>Important:</strong> This verification code is single-use and will expire in <strong>${minutes} minutes</strong>.
            </p>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 12px 0 0 0;">
              If you did not request this verification code, please ignore this email. No account will be created without this verification.
            </p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
MS Backstage — Email Verification Code

Your verification code is: ${params.otp}

This code is single-use and expires in ${minutes} minutes.
If you did not request this code, you can safely ignore this email.
  `.trim();

  return { subject, html, text };
}

/**
 * 7. Digital Ticket Delivery Template (Stage 3)
 */
export function digitalTicketDeliveryTemplate(params: {
  eventName: string;
  attendeeName: string;
  registrationNumber: string;
  category: string;
  ticketName: string;
  ticketDownloadUrl: string;
  venue?: string | null;
  date?: string | null;
  orderReference: string;
}): { subject: string; html: string; text: string } {
  const eventName = escapeHtml(params.eventName);
  const attendeeName = escapeHtml(params.attendeeName);
  const regNumber = escapeHtml(params.registrationNumber);
  const category = escapeHtml(params.category);
  const ticketName = escapeHtml(params.ticketName);
  const downloadUrl = escapeHtml(params.ticketDownloadUrl);
  const venue = escapeHtml(params.venue || 'Venue announced soon');
  const date = escapeHtml(params.date || 'Scheduled Event');

  const subject = `Your Digital Pass & Ticket for ${params.eventName} (${params.registrationNumber})`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
              <span style="color: #166534; font-size: 13px; font-weight: 600;">✓ Pass Confirmed & Admission Ready</span>
            </div>
            <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Here is your ticket, ${attendeeName}</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Your pass for <strong>${eventName}</strong> has been issued. Please download your official PDF ticket below or present the QR code at the check-in desk.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table width="100%" style="font-size: 13px; color: #334155; line-height: 1.8;">
                <tr><td style="color: #64748b; width: 40%;">Registration Number:</td><td style="font-weight: 700; font-family: monospace; font-size: 14px;">${regNumber}</td></tr>
                <tr><td style="color: #64748b;">Ticket Class:</td><td style="font-weight: 600;">${ticketName} (${category})</td></tr>
                <tr><td style="color: #64748b;">Date:</td><td>${date}</td></tr>
                <tr><td style="color: #64748b;">Venue:</td><td>${venue}</td></tr>
              </table>
            </div>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${downloadUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; font-weight: 700; display: inline-block;">
                📥 Download PDF Digital Ticket
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
              <strong>Fast Check-in:</strong> Save this ticket on your mobile device. When you arrive at the venue, our registration desk will scan your ticket's QR code for instant badge printing and entry.
            </p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Digital Pass for ${params.eventName}
Registration Number: ${params.registrationNumber}
Attendee: ${params.attendeeName}
Ticket: ${params.ticketName} (${params.category})
Venue: ${params.venue || 'Announced soon'}
Date: ${params.date || 'Scheduled'}

Download your official PDF Ticket:
${params.ticketDownloadUrl}

Please present your QR code at the entrance check-in desk.
  `.trim();

  return { subject, html, text };
}

/**
 * 8. Organizer Registration Alert Template (Stage 3)
 */
export function organizerRegistrationAlertTemplate(params: {
  eventName: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  attendeeCount: number;
  finalAmount: number;
  currency: string;
  paymentStatus: string;
}): { subject: string; html: string; text: string } {
  const eventName = escapeHtml(params.eventName);
  const orderNumber = escapeHtml(params.orderNumber);
  const customerName = escapeHtml(params.customerName);
  const customerEmail = escapeHtml(params.customerEmail);
  const amountStr = `${params.currency.toUpperCase()} ${params.finalAmount.toFixed(2)}`;
  const statusStr = escapeHtml(params.paymentStatus);

  const subject = `New Registration: ${params.orderNumber} for ${params.eventName} (${params.attendeeCount} Attendee${params.attendeeCount > 1 ? 's' : ''})`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td>${EMAIL_HEADER}</td></tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">New Registration Received</h2>
            <p style="color: #334155; font-size: 14px; margin: 0 0 20px 0;">A new registration order has been confirmed for <strong>${eventName}</strong>.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <table width="100%" style="font-size: 13px; color: #334155; line-height: 1.8;">
                <tr><td style="color: #64748b; width: 40%;">Order Reference:</td><td style="font-weight: 700;">${orderNumber}</td></tr>
                <tr><td style="color: #64748b;">Primary Contact:</td><td>${customerName} (${customerEmail})</td></tr>
                <tr><td style="color: #64748b;">Attendees Registered:</td><td style="font-weight: 700;">${params.attendeeCount}</td></tr>
                <tr><td style="color: #64748b;">Total Amount:</td><td style="font-weight: 700; color: #166534;">${amountStr}</td></tr>
                <tr><td style="color: #64748b;">Status:</td><td><strong>${statusStr}</strong></td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">You can view and manage this order in your MS Backstage event dashboard.</p>
          </td>
        </tr>
        <tr><td>${EMAIL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
New Registration Alert for ${params.eventName}
Order: ${params.orderNumber}
Customer: ${params.customerName} (${params.customerEmail})
Attendees: ${params.attendeeCount}
Amount: ${amountStr}
Status: ${params.paymentStatus}
  `.trim();

  return { subject, html, text };
}


