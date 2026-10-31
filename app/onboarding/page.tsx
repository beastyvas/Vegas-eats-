import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { profile } = await requireUser("/onboarding");
  const next = safeNext((await searchParams).next);
  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="h-display text-3xl">One quick thing</h1>
      <p className="mt-2 text-muted">Where do you live? This keeps the rankings honest: locals&apos; vouches count most.</p>
      <div className="mt-6">
        <OnboardingForm next={next} defaultName={profile?.display_name ?? ""} />
      </div>
    </div>
  );
}
