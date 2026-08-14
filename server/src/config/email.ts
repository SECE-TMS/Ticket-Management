import nodemailer, { type Transporter } from 'nodemailer';
import logger from '../utils/logger';

let transporter: Transporter | null = null;

export const isSmtpConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = (): Transporter | null => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
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
 * Send email if SMTP is configured; otherwise log and return stub result.
 */
export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  const from = process.env.SMTP_FROM || 'noreply@tms.local';
  const tx = getTransporter();

  if (!tx) {
    logger.info(`[email-stub] To: ${to} | Subject: ${subject} | ${text || ''}`);
    return { stub: true as const, to, subject };
  }

  try {
    const info = await tx.sendMail({ from, to, subject, text, html });
    logger.info(`[email-sent] MessageId: ${info.messageId} | To: ${to} | Subject: ${subject}`);
    return info;
  } catch (err: any) {
    logger.error(`[email-error] Failed to send email to ${to}: ${err?.message || err}`);
    throw err;
  }
};
