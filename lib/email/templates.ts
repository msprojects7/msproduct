/**
 * MS Backstage — Unified Clean Light Theme Email Templates
 *
 * Implements a clean, modern, and accessible light theme designed for both
 * desktop and mobile email clients (Gmail, Apple Mail, Outlook, Yahoo).
 */

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://msproduct-seven.vercel.app';
const LOGO_URL = `${APP_URL}/msfav.png`;

interface MasterEmailParams {
  subject: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
}

/**
 * Master Brand Layout Wrapper (Clean Light Theme)
 */
function renderBrandEmail({
  subject,
  badgeText,
  badgeColor = '#2563eb',
  badgeBg = '#eff6ff',
  title,
  subtitle,
  bodyHtml,
}: MasterEmailParams): string {
  const safeSubject = escapeHtml(subject);
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? `<p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">${escapeHtml(subtitle)}</p>` : '';
  const badgeHtml = badgeText
    ? `<span class="badge-pill" style="display: inline-block; background-color: ${badgeBg}; border: 1px solid #bfdbfe; color: ${badgeColor}; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 9999px;">${escapeHtml(badgeText)}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeSubject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-body { padding: 20px 16px !important; }
      .email-header { padding: 14px 16px !important; }
      .brand-title { font-size: 15px !important; }
      .brand-subtitle { font-size: 9px !important; letter-spacing: 0.5px !important; }
      .badge-pill { font-size: 8px !important; padding: 2px 6px !important; letter-spacing: 0.5px !important; }
      .logo-box { width: 32px !important; height: 32px !important; line-height: 32px !important; }
      .logo-img { width: 20px !important; height: 20px !important; }
      .otp-code { font-size: 26px !important; letter-spacing: 5px !important; }
      .main-title { font-size: 17px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; color: #0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td class="email-header" style="background-color: #ffffff; padding: 20px 28px; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <div class="logo-box" style="width: 34px; height: 34px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: center; line-height: 34px;">
                            <img class="logo-img" src="${LOGO_URL}" width="22" height="22" alt="MS" style="display: inline-block; vertical-align: middle; border: 0;" onerror="this.style.display='none'" />
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <span class="brand-title" style="color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: -0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; line-height: 1.15;">
                            MS Backstage
                          </span>
                          <span class="brand-subtitle" style="color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-top: 2px;">
                            Event Operations Platform
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    ${badgeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD BODY -->
          <tr>
            <td class="email-body" style="padding: 28px;">
              <h1 class="main-title" style="color: #0f172a; font-size: 19px; font-weight: 700; line-height: 1.3; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                ${safeTitle}
              </h1>
              ${safeSubtitle}

              <!-- Main Content Body -->
              ${bodyHtml}
            </td>
          </tr>

          <!-- BRAND FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #64748b; font-weight: 500;">
                &copy; 2026 MS Backstage. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Email OTP Verification Template (Light Theme)
 */
export function otpVerificationTemplate(params: {
  otp: string;
  recipientEmail: string;
  expiresInMinutes?: number;
}): { subject: string; html: string; text: string } {
  const otp = escapeHtml(params.otp);
  const minutes = params.expiresInMinutes || 5;
  const subject = `Your MS Backstage Verification Code: ${params.otp}`;

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Welcome to <strong>MS Backstage</strong>. Enter the 6-digit verification code below to authenticate your email address and continue:
    </p>

    <!-- Clean Light Card for OTP Code -->
    <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 20px 0;">
      <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
        One-Time Verification Code
      </span>
      <div style="display: inline-block; background-color: #ffffff; border: 1.5px solid #2563eb; border-radius: 10px; padding: 12px 28px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);">
        <span class="otp-code" style="font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; display: inline-block; margin-left: 8px;">
          ${otp}
        </span>
      </div>
      <div style="margin-top: 14px;">
        <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 9999px;">
          Code expires in ${minutes} minutes
        </span>
      </div>
    </div>
  `;

  const text = `
MS Backstage — Email Verification Code

Your 6-digit verification code is: ${params.otp}
Code expires in ${minutes} minutes.
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'VERIFICATION',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    title: 'Verify Your Email Address',
    subtitle: 'Enter the verification code to proceed with account setup and console access.',
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 2. Password Reset Email Template (Light Theme)
 */
export function passwordResetTemplate(params: {
  resetUrl: string;
  recipientEmail: string;
}): { subject: string; html: string; text: string } {
  const resetUrl = escapeHtml(params.resetUrl);
  const subject = `Reset Your MS Backstage Password`;

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      We received a request to reset your password for your <strong>MS Backstage</strong> account. Click the button below to choose a new password:
    </p>

    <!-- Clean Button Call to Action -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 34px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);">
        Reset Password
      </a>
    </div>

    <div style="text-align: center; margin-top: 16px;">
      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 9999px;">
        Link expires in 5 minutes
      </span>
    </div>
  `;

  const text = `
MS Backstage — Password Reset Request

We received a request to reset your password.
To choose a new password, click the link below:

${params.resetUrl}

This link will expire in 5 minutes.
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'SECURITY ACTION',
    badgeColor: '#4f46e5',
    badgeBg: '#eef2ff',
    title: 'Reset Your Account Password',
    subtitle: 'Authorize your password reset to regain access to your event console.',
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 3. Universal Message & Notification Template (Light Theme)
 */
export function universalNotificationTemplate(params: {
  subject: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  messageHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  keyDetails?: Array<{ label: string; value: string }>;
}): { subject: string; html: string; text: string } {
  const { subject, title, subtitle, badgeText = 'NOTIFICATION' } = params;

  let bodyHtml = `
    <div style="color: #334155; font-size: 14px; line-height: 1.65; margin: 0 0 20px 0;">
      ${params.messageHtml}
    </div>
  `;

  if (params.keyDetails && params.keyDetails.length > 0) {
    bodyHtml += `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
          ${params.keyDetails
            .map(
              (item) => `
            <tr>
              <td style="color: #64748b; font-weight: 500; width: 38%; padding: 4px 0;">${escapeHtml(item.label)}:</td>
              <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${escapeHtml(item.value)}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>
    `;
  }

  if (params.actionButton) {
    const safeUrl = escapeHtml(params.actionButton.url);
    const safeText = escapeHtml(params.actionButton.text);
    bodyHtml += `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
          ${safeText}
        </a>
      </div>
    `;
  }

  const text = `
MS Backstage — ${title}
${subtitle ? `${subtitle}\n` : ''}
${params.messageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
${params.keyDetails ? params.keyDetails.map((k) => `\n- ${k.label}: ${k.value}`).join('') : ''}
${params.actionButton ? `\nLink: ${params.actionButton.url}` : ''}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText,
    title,
    subtitle,
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 4. Organization Invitation Email Template (Light Theme)
 */
export function invitationTemplate(params: {
  organizationName: string;
  role: string;
  inviteUrl: string;
  recipientEmail: string;
  expiresInDays?: number;
}): { subject: string; html: string; text: string } {
  const orgName = escapeHtml(params.organizationName);
  const roleTitle = escapeHtml(params.role.replace(/_/g, ' ').toUpperCase());
  const inviteUrl = escapeHtml(params.inviteUrl);
  const days = params.expiresInDays || 7;
  const subject = `Invitation to join ${params.organizationName} on MS Backstage`;

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      You have been invited to join <strong>${orgName}</strong> on MS Backstage as an <strong>${roleTitle}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 35%;">Organization:</td>
          <td style="color: #0f172a; font-weight: 700;">${orgName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Assigned Role:</td>
          <td style="color: #2563eb; font-weight: 600;">${roleTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Link Validity:</td>
          <td style="color: #475569;">${days} Days</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
        Accept Invitation
      </a>
    </div>
  `;

  const text = `
You have been invited to join ${params.organizationName} on MS Backstage as a ${roleTitle}.
Accept Invitation: ${params.inviteUrl}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'TEAM INVITATION',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    title: "You've Been Invited!",
    subtitle: `Join ${params.organizationName} and collaborate on event operations.`,
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 5. Attendee Registration Confirmation Template (Light Theme)
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

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong>${attendeeName}</strong>, your spot for <strong>${eventName}</strong> has been successfully confirmed.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Registration Number:</td>
          <td style="color: #0f172a; font-family: monospace; font-weight: 700; font-size: 15px;">${regNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Category:</td>
          <td style="color: #0f172a; font-weight: 600;">${category}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Status:</td>
          <td style="color: #16a34a; font-weight: 700;">Confirmed</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 12.5px; line-height: 1.5; margin: 0;">
      Please keep your registration number handy during badge pickup and desk check-in at the venue.
    </p>
  `;

  const text = `
Registration Confirmed for ${params.eventName}
Registration Number: ${params.registrationNumber}
Attendee: ${params.attendeeName}
Category: ${params.category}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'CONFIRMED',
    badgeColor: '#16a34a',
    badgeBg: '#f0fdf4',
    title: 'Registration Confirmed',
    subtitle: `We look forward to welcoming you to ${params.eventName}.`,
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 6. Payment Receipt Template (Light Theme)
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

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you, <strong>${attendeeName}</strong>. Your payment for <strong>${eventName}</strong> has been received and processed.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Amount Paid:</td>
          <td style="color: #16a34a; font-weight: 800; font-size: 16px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Payment ID:</td>
          <td style="color: #0f172a; font-family: monospace;">${paymentId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Order ID:</td>
          <td style="color: #0f172a; font-family: monospace;">${orderId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Status:</td>
          <td style="color: #16a34a; font-weight: 700;">Completed</td>
        </tr>
      </table>
    </div>
  `;

  const text = `
Payment Receipt for ${params.eventName}
Amount: ${formattedAmount}
Payment ID: ${params.paymentId}
Order ID: ${params.orderId}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'RECEIPT',
    badgeColor: '#16a34a',
    badgeBg: '#f0fdf4',
    title: 'Payment Received',
    subtitle: `Transaction confirmed for ${params.eventName}.`,
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 7. Security Alert Template (Light Theme)
 */
export function securityAlertTemplate(params: {
  action: string;
  recipientEmail: string;
  timestamp: string;
}): { subject: string; html: string; text: string } {
  const action = escapeHtml(params.action);
  const timestamp = escapeHtml(params.timestamp);
  const subject = `Security Alert: ${params.action} on your MS Backstage account`;

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A sensitive security action was recently recorded on your account:
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
      <span style="color: #b91c1c; font-size: 14px; font-weight: 700; display: block; margin-bottom: 4px;">
        ${action}
      </span>
      <span style="color: #7f1d1d; font-size: 12px; display: block;">
        Timestamp: ${timestamp}
      </span>
    </div>
  `;

  const text = `
Security Alert: ${params.action}
Timestamp: ${params.timestamp}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'SECURITY ALERT',
    badgeColor: '#dc2626',
    badgeBg: '#fef2f2',
    title: 'Security Alert',
    subtitle: 'Account monitoring detected an authentication event.',
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 8. Digital Ticket Delivery Template (Light Theme)
 */
export function digitalTicketDeliveryTemplate(params: {
  eventName: string;
  attendeeName: string;
  registrationNumber: string;
  ticketName: string;
  category: string;
  venue?: string | null;
  date?: string | null;
  orderReference?: string | null;
  ticketDownloadUrl: string;
}): { subject: string; html: string; text: string } {
  const eventName = escapeHtml(params.eventName);
  const attendeeName = escapeHtml(params.attendeeName);
  const regNumber = escapeHtml(params.registrationNumber);
  const ticketName = escapeHtml(params.ticketName);
  const category = escapeHtml(params.category);
  const venue = escapeHtml(params.venue || 'Announced in event portal');
  const date = escapeHtml(params.date || 'Scheduled Event');
  const downloadUrl = escapeHtml(params.ticketDownloadUrl);
  const subject = `Your Digital Pass: ${params.eventName} (${params.registrationNumber})`;

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Hello <strong>${attendeeName}</strong>, your digital admission pass for <strong>${eventName}</strong> is ready.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Pass Reference:</td>
          <td style="color: #0f172a; font-family: monospace; font-weight: 700; font-size: 14px;">${regNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Ticket:</td>
          <td style="color: #0f172a; font-weight: 600;">${ticketName} (${category})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Date:</td>
          <td style="color: #0f172a;">${date}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Venue:</td>
          <td style="color: #0f172a;">${venue}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 26px 0;">
      <a href="${downloadUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
        Download PDF Ticket
      </a>
    </div>
  `;

  const text = `
Digital Pass for ${params.eventName}
Pass: ${params.registrationNumber}
Attendee: ${params.attendeeName}
Ticket: ${params.ticketName}
Download: ${params.ticketDownloadUrl}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'DIGITAL TICKET',
    badgeColor: '#2563eb',
    badgeBg: '#eff6ff',
    title: 'Your Digital Pass is Ready',
    subtitle: `Access details for ${params.eventName}.`,
    bodyHtml,
  });

  return { subject, html, text };
}

/**
 * 9. Organizer Registration Alert Template (Light Theme)
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

  const bodyHtml = `
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A new registration order has been confirmed for <strong>${eventName}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Order Reference:</td>
          <td style="color: #0f172a; font-family: monospace; font-weight: 700;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Customer:</td>
          <td style="color: #0f172a; font-weight: 600;">${customerName} (${customerEmail})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Attendees:</td>
          <td style="color: #0f172a; font-weight: 600;">${params.attendeeCount}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Total:</td>
          <td style="color: #16a34a; font-weight: 700;">${amountStr}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Status:</td>
          <td style="color: #16a34a; font-weight: 700;">${statusStr}</td>
        </tr>
      </table>
    </div>
  `;

  const text = `
New Registration for ${params.eventName}
Order: ${params.orderNumber}
Customer: ${params.customerName}
Attendees: ${params.attendeeCount}
Amount: ${amountStr}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'NEW ORDER',
    badgeColor: '#16a34a',
    badgeBg: '#f0fdf4',
    title: 'New Event Registration',
    subtitle: `An order has been completed for ${params.eventName}.`,
    bodyHtml,
  });

  return { subject, html, text };
}
