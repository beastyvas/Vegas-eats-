import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { signInWithGoogle } from "./actions";
import { safeNext } from "@/lib/safe-next";
import { friendlyAuthError } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="h-display text-3xl">Sign in</h1>
      <p className="mt-2 text-muted">Vouch for your spots, follow trucks, or claim your business. No passwords.</p>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-chile/10 p-3 text-sm font-bold text-chile">{friendlyAuthError(sp.error)}</p>}
      <div className="mt-6 space-y-6">
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn-secondary w-full">Continue with Google</button>
        </form>
        <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
