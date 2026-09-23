import nodemailer, { type Transporter } from 'nodemailer';
import logger from '../utils/logger';

let transporter: Transporter | null = null;

export const isResendConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY);

export const isBrevoConfigured = (): boolean => Boolean(process.env.BREVO_API_KEY);

export const isSmtpConfigured = (): boolean =>
  Boolean(
    (process.env.SMTP_HOST || process.env.SMTP_SERVICE) &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

export const isEmailServiceConfigured = (): boolean =>
  isResendConfigured() || isBrevoConfigured() || isSmtpConfigured();

const getTransporter = (): Transporter | null => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    const isGmail =
      process.env.SMTP_HOST === 'smtp.gmail.com' ||
      process.env.SMTP_SERVICE?.toLowerCase() === 'gmail';

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }
  return transporter;
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends email via Resend API (HTTPS), Brevo API (HTTPS), or Nodemailer (SMTP).
 * Using HTTPS APIs (Resend/Brevo) completely bypasses Render port blocking.
 */
export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'TMS Portal <onboarding@resend.dev>';

  // 1. Check for Resend HTTP API (Best for Render - Port 443 HTTPS)
  if (isResendConfigured()) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'TMS Portal <onboarding@resend.dev>',
          to: [to],
          subject,
          html: html || text,
          text: text || undefined,
        }),
      });

      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Resend error ${response.status}`);
      }
      logger.info(`[email-sent-resend] Id: ${data.id} | To: ${to} | Subject: ${subject}`);
      return { messageId: data.id, to, subject };
    } catch (err: any) {
      logger.error(`[email-resend-error] Failed to send email to ${to}: ${err?.message || err}`);
      throw err;
    }
  }

  // 2. Check for Brevo HTTP API (Port 443 HTTPS)
  if (isBrevoConfigured()) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: process.env.SMTP_FROM || 'ticket@sece.ac.in', name: 'TMS Portal' },
          to: [{ email: to }],
          subject,
          htmlContent: html || text,
          textContent: text || undefined,
        }),
      });

      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Brevo error ${response.status}`);
      }
      logger.info(`[email-sent-brevo] MessageId: ${data.messageId} | To: ${to} | Subject: ${subject}`);
      return { messageId: data.messageId, to, subject };
    } catch (err: any) {
      logger.error(`[email-brevo-error] Failed to send email to ${to}: ${err?.message || err}`);
      throw err;
    }
  }

  // 3. Fallback to Nodemailer SMTP
  const tx = getTransporter();
  if (!tx) {
    logger.info(`[email-stub] To: ${to} | Subject: ${subject} | ${text || ''}`);
    return { stub: true as const, to, subject };
  }

  try {
    const info = await tx.sendMail({ from, to, subject, text, html });
    logger.info(`[email-sent-smtp] MessageId: ${info.messageId} | To: ${to} | Subject: ${subject}`);
    return info;
  } catch (err: any) {
    logger.error(`[email-error] Failed to send email to ${to}: ${err?.message || err}`);
    throw err;
  }
};
