import { createHash, randomInt } from "node:crypto";

// No 0/O/1/I/L so codes survive being read off a phone and typed into a DM.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

export function normalizeCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashCode(claimId: string, code: string) {
  return createHash("sha256").update(`${claimId}:${normalizeCode(code)}`).digest("hex");
}

export const MAX_CODE_ATTEMPTS = 5;
export const CODE_TTL_HOURS = { ig_code: 72, email_code: 2 } as const;
