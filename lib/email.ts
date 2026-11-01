import "server-only";
import { brand } from "@/config/brand";

export const emailEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.OUTREACH_FROM_EMAIL;

/** Minimal Resend client (REST, no SDK). Throws on failure. */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!emailEnabled()) throw new Error("Email isn't configured (RESEND_API_KEY / OUTREACH_FROM_EMAIL).");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${brand.name} <${process.env.OUTREACH_FROM_EMAIL}>`, to: [to], subject, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status})`);
}

/** "bake.bykatelv@gmail.com" -> "b•••••••••v@gmail.com" */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "•••";
  return user.length <= 2 ? `${user[0]}•@${domain}` : `${user[0]}${"•".repeat(Math.min(user.length - 2, 8))}${user.at(-1)}@${domain}`;
}
