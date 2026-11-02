/** Turn raw Supabase auth errors into something a person can act on. */
export function friendlyAuthError(raw: string): string {
  const e = raw.toLowerCase();
  if (e.includes("code verifier") || e.includes("pkce"))
    return "That sign-in link opened in a different browser than the one you requested it from (common when tapping it inside the Gmail or Mail app). Request a new link and open it in the same browser, or use Continue with Google.";
  if (e.includes("expired") || e.includes("invalid") && e.includes("otp"))
    return "That sign-in link expired or was already used. Request a new one.";
  if (e.includes("rate limit"))
    return "Too many sign-in emails were sent recently. Wait a bit and try again, or use Continue with Google.";
  return raw;
}
