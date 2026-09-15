import nodemailer from 'nodemailer';
import logger from '../utils/logger';

export const isSmtpConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

/**
 * Always create a fresh transporter — never cache it.
 * A stale/bad cached transporter would silently stub all emails forever.
 */
const createTransporter = () => {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email via SMTP.
 * Throws on failure so callers can decide whether to surface the error or swallow it.
 * Falls back to stub-log only when SMTP is not configured at all.
 */
export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  const from = process.env.SMTP_FROM || 'noreply@sece.ac.in';
  const tx = createTransporter();

  if (!tx) {
    logger.warn(`[email-stub] SMTP not configured. To: ${to} | Subject: ${subject}`);
    return { stub: true as const, to, subject };
  }

  try {
    const info = await tx.sendMail({ from, to, subject, text, html });
    logger.info(`[email-sent] MessageId: ${info.messageId} | To: ${to} | Subject: ${subject}`);
    return info;
  } catch (err: any) {
    logger.error(`[email-error] Failed to send to ${to}: ${err?.message || err}`);
    throw err;
  }
};
