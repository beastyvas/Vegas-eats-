import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const EVENT_KINDS = ["view", "click_order", "click_instagram", "click_tiktok", "click_directions", "click_phone", "click_website", "click_social"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|headless|curl|wget|python|axios|node-fetch|vercel/i;

export function isBot(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  return !ua || BOT.test(ua) || req.headers.get("x-purpose") === "preview" || req.headers.get("purpose") === "prefetch";
}

/** Anonymous per-visitor-per-day hash. No IPs or user agents are stored. */
export function sessionHash(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const ua = req.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? "salt";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("base64url").slice(0, 22);
}

function referrerHost(req: NextRequest) {
  try {
    const r = req.headers.get("referer");
    return r ? new URL(r).hostname.replace(/^www\./, "").slice(0, 100) : null;
  } catch {
    return null;
  }
}

export async function recordEvent(req: NextRequest, listingId: string, kind: EventKind) {
  if (isBot(req) || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    await createAdminClient().from("events").insert({ listing_id: listingId, kind, session_hash: sessionHash(req), referrer_host: referrerHost(req) });
  } catch {
    // analytics must never break the user's click
  }
}
