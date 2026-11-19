/**
 * MS Backstage — Unified Brand Email Templates
 *
 * Implements the sleek dark/navy glass website theme across all transactional emails:
 * - OTP Verification Codes
 * - Password Reset Requests
 * - Universal Message / System Notifications
 * - Organization Invitations
 * - Attendee Confirmations & Digital Tickets
 * - Payment Receipts & Security Alerts
 *
 * Responsive, inline-styled, accessible, and fully compatible with Gmail,
 * Apple Mail, Outlook, Yahoo, and mobile email clients.
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
  title: string;
  subtitle?: string;
  bodyHtml: string;
  securityNotice?: string;
}

/**
 * Master Brand Layout Wrapper (MS Backstage Website Theme)
 */
function renderBrandEmail({
  subject,
  badgeText = 'SECURITY & IDENTITY',
  badgeColor = '#3b82f6',
  title,
  subtitle,
  bodyHtml,
  securityNotice = 'MS Backstage will never request your verification code, password, or authentication credentials via phone or unauthenticated message.',
}: MasterEmailParams): string {
  const safeSubject = escapeHtml(subject);
  const safeBadge = escapeHtml(badgeText);
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? `<p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">${escapeHtml(subtitle)}</p>` : '';
  const safeNotice = escapeHtml(securityNotice);

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
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-body { padding: 24px 18px !important; }
      .email-header { padding: 20px 18px !important; }
      .otp-code { font-size: 30px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #060911; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; color: #f8fafc;">
  <!-- Background Glow & Table Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060911;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #0d1322; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td class="email-header" style="background: linear-gradient(180deg, #131c31 0%, #0d1322 100%); padding: 26px 32px; border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <!-- Logo Icon Container -->
                          <div style="width: 40px; height: 40px; background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 12px; text-align: center; line-height: 40px;">
                            <img src="${LOGO_URL}" width="26" height="26" alt="MS" style="display: inline-block; vertical-align: middle; border: 0; outline: none; text-decoration: none;" onerror="this.style.display='none'" />
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: -0.4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; line-height: 1.2;">
                            MS Backstage
                          </span>
                          <span style="color: #64748b; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">
                            Event Operations Platform
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <!-- Badge Pill -->
                    <span style="display: inline-block; background-color: rgba(37, 99, 235, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: ${badgeColor}; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 4px 10px; border-radius: 9999px;">
                      ${safeBadge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD BODY -->
          <tr>
            <td class="email-body" style="padding: 36px 32px;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 10px 0; letter-spacing: -0.3px;">
                ${safeTitle}
              </h1>
              ${safeSubtitle}

              <!-- Main Content Body -->
              ${bodyHtml}

              <!-- Security Notice Card -->
              <div style="background-color: #080d1a; border: 1px solid #1a253c; border-radius: 12px; padding: 14px 16px; margin-top: 30px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width: 24px; vertical-align: top; padding-right: 10px; font-size: 16px;">
                      🛡️
                    </td>
                    <td style="color: #94a3b8; font-size: 11.5px; line-height: 1.55; vertical-align: middle;">
                      <strong style="color: #cbd5e1;">Security Notice:</strong> ${safeNotice}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- BRAND FOOTER -->
          <tr>
            <td style="background-color: #080c16; padding: 24px 32px; border-top: 1px solid #172033; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 11.5px; font-weight: 500;">
                      Next-Generation Event Intelligence &bull; High-Throughput Check-In &bull; Console Operations
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                      This is an automated operational notification dispatched by MS Backstage.<br>
                      Please do not reply directly to this email. For assistance, contact your event administrator.
                    </p>
                    <div style="font-size: 11px; color: #475569; padding-top: 6px; border-top: 1px solid #121a2d;">
                      &copy; 2026 MS Backstage. All rights reserved. &bull;
                      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none; margin-left: 4px;">Console Access</a>
                    </div>
                  </td>
                </tr>
              </table>
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
 * 1. Email OTP Verification Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Welcome to <strong>MS Backstage</strong>. Enter the 6-digit verification code below to authenticate your email address and continue:
    </p>

    <!-- Modern Dark Glass OTP Card -->
    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 16px; padding: 26px 20px; text-align: center; margin: 24px 0;">
      <span style="display: block; color: #64748b; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
        One-Time Verification Code
      </span>
      <div style="display: inline-block; background-color: #0e172e; border: 1.5px solid #2563eb; border-radius: 12px; padding: 14px 28px; box-shadow: 0 0 25px rgba(37, 99, 235, 0.3);">
        <span class="otp-code" style="font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #60a5fa; text-shadow: 0 0 15px rgba(96, 165, 250, 0.5); display: inline-block; margin-left: 10px;">
          ${otp}
        </span>
      </div>
      <div style="margin-top: 16px;">
        <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 600; padding: 3px 12px; border-radius: 9999px;">
          ⏱️ Code expires in ${minutes} minutes
        </span>
      </div>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
      If you did not initiate this request, you can safely disregard this email. Your account remains completely secure and no changes have been applied.
    </p>
  `;

  const text = `
MS Backstage — Email Verification Code

Your 6-digit verification code is: ${params.otp}

This code is valid for ${minutes} minutes and can only be used once.
If you did not request this verification, please disregard this email.

Console: ${APP_URL}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'VERIFICATION',
    badgeColor: '#3b82f6',
    title: 'Verify Your Email Address',
    subtitle: 'Enter the verification code to proceed with account setup and console access.',
    bodyHtml,
    securityNotice: `This code will expire in ${minutes} minutes. Never share this code with anyone, including MS Backstage support.`,
  });

  return { subject, html, text };
}

/**
 * 2. Password Reset Email Template (Website Theme)
 */
export function passwordResetTemplate(params: {
  resetUrl: string;
  recipientEmail: string;
}): { subject: string; html: string; text: string } {
  const resetUrl = escapeHtml(params.resetUrl);
  const subject = `Reset Your MS Backstage Password`;

  const bodyHtml = `
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      We received an authorization request to reset the password for your <strong>MS Backstage</strong> account. Click the button below to choose a new password:
    </p>

    <!-- Primary Gradient Call to Action -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; display: inline-block; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45); letter-spacing: 0.3px;">
        Reset Password &rarr;
      </a>
    </div>

    <!-- Direct Link Fallback Box -->
    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <span style="display: block; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        Direct Link Fallback
      </span>
      <p style="margin: 0; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #38bdf8; line-height: 1.5;">
        ${resetUrl}
      </p>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
      This password reset link is single-use and will expire in <strong>1 hour</strong>. If you did not request a password reset, no action is needed and your account password remains unchanged.
    </p>
  `;

  const text = `
MS Backstage — Password Reset Request

We received a request to reset your password.
To set a new password, open the link below:

${params.resetUrl}

This link will expire in 1 hour.
If you did not make this request, please disregard this email.
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'SECURITY ACTION',
    badgeColor: '#818cf8',
    title: 'Reset Your Account Password',
    subtitle: 'Authorize your password reset to regain access to your event console.',
    bodyHtml,
    securityNotice: 'If you did not request this password reset, please review your recent account security or contact your administrator.',
  });

  return { subject, html, text };
}

/**
 * 3. Universal Message & Notification Template (Website Theme)
 * Use this template for any general notification, announcement, or alert message.
 */
export function universalNotificationTemplate(params: {
  subject: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  messageHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  keyDetails?: Array<{ label: string; value: string }>;
  securityNotice?: string;
}): { subject: string; html: string; text: string } {
  const { subject, title, subtitle, badgeText = 'ANNOUNCEMENT', badgeColor = '#3b82f6' } = params;

  let bodyHtml = `
    <div style="color: #cbd5e1; font-size: 14px; line-height: 1.65; margin: 0 0 20px 0;">
      ${params.messageHtml}
    </div>
  `;

  // Render optional key details table
  if (params.keyDetails && params.keyDetails.length > 0) {
    bodyHtml += `
      <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #cbd5e1; line-height: 1.8;">
          ${params.keyDetails
            .map(
              (item) => `
            <tr>
              <td style="color: #64748b; font-weight: 500; width: 38%; padding: 4px 0;">${escapeHtml(item.label)}:</td>
              <td style="color: #f1f5f9; font-weight: 600; padding: 4px 0;">${escapeHtml(item.value)}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>
    `;
  }

  // Render optional action button
  if (params.actionButton) {
    const safeUrl = escapeHtml(params.actionButton.url);
    const safeText = escapeHtml(params.actionButton.text);
    bodyHtml += `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safeUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; display: inline-block; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45); letter-spacing: 0.2px;">
          ${safeText} &rarr;
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

Console: ${APP_URL}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText,
    badgeColor,
    title,
    subtitle,
    bodyHtml,
    securityNotice: params.securityNotice,
  });

  return { subject, html, text };
}

/**
 * 4. Organization Invitation Email Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      You have been invited to join <strong style="color: #ffffff;">${orgName}</strong> on MS Backstage with the role of <strong style="color: #60a5fa;">${roleTitle}</strong>.
    </p>

    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #cbd5e1; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 35%;">Organization:</td>
          <td style="color: #ffffff; font-weight: 700;">${orgName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Assigned Role:</td>
          <td style="color: #60a5fa; font-weight: 600;">${roleTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Link Validity:</td>
          <td style="color: #94a3b8;">${days} Days</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 13px 34px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; display: inline-block; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45);">
        Accept Invitation &rarr;
      </a>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0;">
      If you were not expecting this invitation, you can safely ignore this email. Direct link: <br>
      <span style="font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all;">${inviteUrl}</span>
    </p>
  `;

  const text = `
You have been invited to join ${params.organizationName} on MS Backstage as a ${roleTitle}.
Accept Invitation: ${params.inviteUrl}
Link valid for ${days} days.
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'TEAM INVITATION',
    badgeColor: '#60a5fa',
    title: "You've Been Invited!",
    subtitle: `Join ${params.organizationName} and collaborate on event operations.`,
    bodyHtml,
    securityNotice: `This invitation link is valid for ${days} days and restricted to ${params.recipientEmail}.`,
  });

  return { subject, html, text };
}

/**
 * 5. Attendee Registration Confirmation Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #ffffff;">${attendeeName}</strong>, your spot for <strong style="color: #ffffff;">${eventName}</strong> is officially secured.
    </p>

    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin: 22px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #cbd5e1; line-height: 1.9;">
        <tr>
          <td style="color: #64748b; width: 40%;">Registration Number:</td>
          <td style="color: #38bdf8; font-family: monospace; font-weight: 700; font-size: 15px;">${regNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Attendee Category:</td>
          <td style="color: #ffffff; font-weight: 600;">${category}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Admission Status:</td>
          <td style="color: #34d399; font-weight: 700;">✓ Confirmed</td>
        </tr>
      </table>
    </div>

    <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.6; margin: 0;">
      Keep your registration number accessible during entry. Our front desk kiosk will scan your confirmation code for instant badge issuance.
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
    badgeText: 'ADMISSION CONFIRMED',
    badgeColor: '#34d399',
    title: 'Your Registration is Confirmed',
    subtitle: `We look forward to welcoming you to ${params.eventName}.`,
    bodyHtml,
    securityNotice: 'Present this confirmation email or your registration number at the venue registration desk.',
  });

  return { subject, html, text };
}

/**
 * 6. Payment Receipt Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you, <strong style="color: #ffffff;">${attendeeName}</strong>. Your payment for <strong style="color: #ffffff;">${eventName}</strong> has been successfully processed.
    </p>

    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin: 22px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #cbd5e1; line-height: 1.9;">
        <tr>
          <td style="color: #64748b; width: 40%;">Amount Paid:</td>
          <td style="color: #34d399; font-weight: 800; font-size: 17px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Payment Reference:</td>
          <td style="color: #38bdf8; font-family: monospace;">${paymentId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Order Identifier:</td>
          <td style="color: #f1f5f9; font-family: monospace;">${orderId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Transaction Status:</td>
          <td style="color: #34d399; font-weight: 700;">Completed &amp; Settled</td>
        </tr>
      </table>
    </div>
  `;

  const text = `
Payment Receipt for ${params.eventName}
Amount: ${formattedAmount}
Payment ID: ${params.paymentId}
Order ID: ${params.orderId}
Status: Completed
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'PAYMENT SUCCESS',
    badgeColor: '#34d399',
    title: 'Payment Receipt',
    subtitle: `Transaction confirmed for ${params.eventName}.`,
    bodyHtml,
    securityNotice: 'Retain this electronic receipt for your billing and accounting records.',
  });

  return { subject, html, text };
}

/**
 * 7. Security Alert Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A sensitive security action was recently recorded on your account:
    </p>

    <div style="background-color: #1a0b0e; border: 1px solid #7f1d1d; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <span style="color: #f87171; font-size: 14px; font-weight: 700; display: block; margin-bottom: 6px;">
        ${action}
      </span>
      <span style="color: #fca5a5; font-size: 12px; display: block;">
        Timestamp: ${timestamp}
      </span>
    </div>

    <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.6; margin: 0;">
      If this was initiated by you, no further action is necessary. If you did not perform this action, please reset your password immediately and notify platform security.
    </p>
  `;

  const text = `
Security Alert: ${params.action}
Timestamp: ${params.timestamp}
If this was not you, please secure your account immediately.
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'SECURITY ALERT',
    badgeColor: '#ef4444',
    title: 'Security Notification',
    subtitle: 'Account monitoring detected an administrative or authentication event.',
    bodyHtml,
    securityNotice: 'If you suspect unauthorized activity, change your password immediately in your account settings.',
  });

  return { subject, html, text };
}

/**
 * 8. Digital Ticket Delivery Template (Website Theme)
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
  const venue = escapeHtml(params.venue || 'Venue details provided in event portal');
  const date = escapeHtml(params.date || 'Scheduled Event');
  const downloadUrl = escapeHtml(params.ticketDownloadUrl);
  const subject = `Your Digital Pass: ${params.eventName} (${params.registrationNumber})`;

  const bodyHtml = `
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Hello <strong style="color: #ffffff;">${attendeeName}</strong>, your digital admission pass for <strong style="color: #ffffff;">${eventName}</strong> is issued and ready.
    </p>

    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 14px; padding: 22px; margin: 22px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #cbd5e1; line-height: 1.9;">
        <tr>
          <td style="color: #64748b; width: 40%;">Pass Reference:</td>
          <td style="color: #38bdf8; font-family: monospace; font-weight: 700; font-size: 15px;">${regNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Ticket Class:</td>
          <td style="color: #ffffff; font-weight: 700;">${ticketName} (${category})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Event Date:</td>
          <td style="color: #f1f5f9;">${date}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Location:</td>
          <td style="color: #f1f5f9;">${venue}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; display: inline-block; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45);">
        📥 Download Digital Pass (PDF) &rarr;
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12.5px; line-height: 1.6; margin: 0;">
      <strong>Express Entry:</strong> Save this digital pass to your mobile device. Present the pass QR code at the check-in terminal for touchless badge printing.
    </p>
  `;

  const text = `
Digital Pass for ${params.eventName}
Pass: ${params.registrationNumber}
Attendee: ${params.attendeeName}
Ticket: ${params.ticketName} (${params.category})
Download URL: ${params.ticketDownloadUrl}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'DIGITAL TICKET',
    badgeColor: '#38bdf8',
    title: 'Your Digital Pass is Ready',
    subtitle: `Access credentials and badge QR code for ${params.eventName}.`,
    bodyHtml,
    securityNotice: 'Each digital pass QR code is cryptographically unique and permits admission for one attendee.',
  });

  return { subject, html, text };
}

/**
 * 9. Organizer Registration Alert Template (Website Theme)
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
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A new attendee order has been confirmed for <strong style="color: #ffffff;">${eventName}</strong>.
    </p>

    <div style="background-color: #060a14; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin: 22px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #cbd5e1; line-height: 1.9;">
        <tr>
          <td style="color: #64748b; width: 40%;">Order Reference:</td>
          <td style="color: #38bdf8; font-family: monospace; font-weight: 700;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Primary Contact:</td>
          <td style="color: #ffffff; font-weight: 600;">${customerName} (${customerEmail})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Attendees Registered:</td>
          <td style="color: #f1f5f9; font-weight: 700;">${params.attendeeCount}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Order Total:</td>
          <td style="color: #34d399; font-weight: 800;">${amountStr}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Payment Status:</td>
          <td style="color: #34d399; font-weight: 700;">${statusStr}</td>
        </tr>
      </table>
    </div>
  `;

  const text = `
New Registration Alert for ${params.eventName}
Order: ${params.orderNumber}
Customer: ${params.customerName} (${params.customerEmail})
Attendees: ${params.attendeeCount}
Amount: ${amountStr}
  `.trim();

  const html = renderBrandEmail({
    subject,
    badgeText: 'NEW ORDER',
    badgeColor: '#34d399',
    title: 'New Event Registration',
    subtitle: `An order has been completed for ${params.eventName}.`,
    bodyHtml,
    securityNotice: 'Order details and badge print records are synced to your event console.',
  });

  return { subject, html, text };
}
