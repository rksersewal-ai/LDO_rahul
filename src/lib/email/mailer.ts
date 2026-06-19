import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { logError } from "@/lib/logging/structured-logger";

let transporter: Transporter | null = null;

/**
 * Build a fresh Nodemailer transporter from the current environment variables.
 * Reading the vars inside this function (rather than at module load time) means
 * that test environments can set SMTP_* after the module is imported, and a
 * new call to getTransporter() will still pick up the correct values.
 */
function buildTransporter(): Transporter {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
}

/**
 * Send an email using the configured SMTP transport.
 * Returns true on success, false on failure (errors are logged via structured logger).
 * Resets the cached transporter on failure so the next call gets a fresh one.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const from = process.env.SMTP_FROM ?? "noreply@ldo-edms.local";
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (error) {
    // Discard the broken transporter so the next send attempt creates a fresh one.
    transporter = null;
    logError("[mailer] Failed to send email", { to: params.to, subject: params.subject }, error);
    return false;
  }
}
