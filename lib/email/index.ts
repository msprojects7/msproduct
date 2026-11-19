/**
 * MS Backstage — Server-Side Email Delivery Service
 *
 * Implements a secure email transport compatible with any standard SMTP provider
 * (Amazon SES, SendGrid, Mailgun, Postmark, Google Workspace, etc.).
 *
 * Security & Reliability Guarantees:
 * 1. Credentials remain strictly server-side.
 * 2. Never logs passwords, tokens, or sensitive payload data.
 * 3. Graceful fallback when unconfigured without throwing unhandled exceptions.
 * 4. Strictly validates recipient addresses before sending.
 */

import net from 'net';
import tls from 'tls';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  configured: boolean;
  messageId?: string;
  error?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

/**
 * Validates basic email syntax
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Lightweight native SMTP client using Node.js net/tls sockets
 */
async function sendViaSmtp(options: EmailOptions): Promise<SendResult> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASSWORD!;
  const rawFrom = process.env.SMTP_FROM || `MS Backstage <${user}>`;
  const fromMatch = rawFrom.match(/<([^>]+)>/);
  const bareFrom = (fromMatch ? fromMatch[1] : rawFrom.replace(/\"/g, '')).trim();
  const fromHeader = rawFrom.includes('<') ? rawFrom : `"${rawFrom}" <${bareFrom}>`;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  return new Promise((resolve) => {
    let socket: net.Socket;
    const timeout = 15000; // 15 second timeout

    const handleFailure = (err: string) => {
      if (socket && !socket.destroyed) socket.destroy();
      resolve({ success: false, configured: true, error: err });
    };

    try {
      if (isSecure) {
        socket = tls.connect({ host, port, timeout }, onConnect);
      } else {
        socket = net.connect({ host, port }, onConnect);
      }
    } catch (e) {
      return handleFailure(e instanceof Error ? e.message : 'Failed to establish socket connection');
    }

    socket.setTimeout(timeout);
    socket.on('timeout', () => handleFailure('SMTP connection timed out'));
    socket.on('error', (err) => handleFailure(`SMTP socket error: ${err.message}`));

    let step = 0;

    function sendCommand(cmd: string) {
      if (socket && !socket.destroyed) {
        socket.write(cmd + '\r\n');
      }
    }

    function onConnect() {
      // Waiting for initial 220 banner from server
    }

    let buffer = '';

    socket.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      const code = parseInt(lastLine.substring(0, 3), 10);

      // Handle multi-line responses (e.g. 250-...) where more lines are pending
      if (lastLine.length >= 4 && lastLine.charAt(3) === '-') return;

      buffer = '';

      if (step === 0 && code === 220) {
        step = 1;
        sendCommand(`EHLO ms-backstage`);
      } else if (step === 1 && code === 250) {
        step = 2;
        sendCommand('AUTH LOGIN');
      } else if (step === 2 && code === 334) {
        step = 3;
        sendCommand(Buffer.from(user).toString('base64'));
      } else if (step === 3 && code === 334) {
        step = 4;
        sendCommand(Buffer.from(pass).toString('base64'));
      } else if (step === 4 && code === 235) {
        step = 5;
        sendCommand(`MAIL FROM:<${bareFrom}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        sendCommand(`RCPT TO:<${options.to}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        sendCommand('DATA');
      } else if (step === 7 && code === 354) {
        step = 8;
        const msgId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@ms-backstage>`;
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        const emailContent = [
          `From: ${fromHeader}`,
          `To: ${options.to}`,
          `Subject: ${options.subject}`,
          `Message-ID: ${msgId}`,
          `Date: ${new Date().toUTCString()}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/plain; charset="utf-8"`,
          `Content-Transfer-Encoding: 7bit`,
          '',
          options.text,
          '',
          `--${boundary}`,
          `Content-Type: text/html; charset="utf-8"`,
          `Content-Transfer-Encoding: 7bit`,
          '',
          options.html,
          '',
          `--${boundary}--`,
          '.',
        ].join('\r\n');

        sendCommand(emailContent);
      } else if (step === 8 && code === 250) {
        step = 9;
        sendCommand('QUIT');
        if (!socket.destroyed) socket.end();
        resolve({ success: true, configured: true, messageId: `msg_${Date.now()}` });
      } else if (code >= 400) {
        handleFailure(`SMTP server rejected with code ${code}: ${lastLine}`);
      }
    });
  });
}

/**
 * Public dispatch function
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  if (!isValidEmail(options.to)) {
    return { success: false, configured: false, error: 'Invalid recipient email address' };
  }

  if (!isSmtpConfigured()) {
    // Graceful unconfigured state
    return {
      success: false,
      configured: false,
      error: 'SMTP server is unconfigured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in environment.',
    };
  }

  return sendViaSmtp(options);
}

/**
 * Records an email dispatch attempt to the persistent email_delivery_logs table.
 * Non-blocking and resilient to database transients.
 */
export async function logEmailDelivery(params: {
  eventId: string;
  orderId?: string | null;
  recipientEmail: string;
  emailType: string;
  subject: string;
  status: 'queued' | 'sent' | 'failed';
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const { db } = await import('@/db/index');
    const { emailDeliveryLogs } = await import('@/db/schema/index');
    await db.insert(emailDeliveryLogs).values({
      eventId: params.eventId,
      orderId: params.orderId || null,
      recipientEmail: params.recipientEmail,
      emailType: params.emailType,
      subject: params.subject,
      status: params.status,
      errorMessage: params.errorMessage || null,
    });
  } catch (e) {
    console.error('Failed to record email delivery log:', e);
  }
}

export * from './templates';

