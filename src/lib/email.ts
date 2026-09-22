import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** False on Vercel without SMTP settings, where emails can't be sent or saved. */
export const emailDeliverable = Boolean(process.env.SMTP_HOST) || !process.env.VERCEL;

type Mail = { to: string; subject: string; html: string; text: string };

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

/**
 * Sends via SMTP when configured. Otherwise writes the email to ./.outbox for
 * inspection (or just logs it on Vercel, whose filesystem is read-only).
 */
export async function sendMail(mail: Mail) {
  const from = process.env.EMAIL_FROM || "Fairfax Peak <hello@fairfaxpeak.local>";
  if (transport) {
    await transport.sendMail({ from, ...mail });
    return;
  }
  if (process.env.VERCEL) {
    console.warn(`email: SMTP not configured; not sending "${mail.subject}" to ${mail.to}`);
    return;
  }
  const dir = path.join(process.cwd(), ".outbox");
  await mkdir(dir, { recursive: true });
  const file = `${new Date().toISOString().replace(/[:.]/g, "-")}-${mail.to.replace(/[^a-z0-9]/gi, "_")}.html`;
  await writeFile(path.join(dir, file), `<!-- To: ${mail.to}\nSubject: ${mail.subject} -->\n${mail.html}`);
}
