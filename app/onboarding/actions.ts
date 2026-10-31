"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

const schema = z.object({
  zip: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit zip code."),
  display_name: z.string().trim().max(60).optional().transform((v) => v || null),
});

export type OnboardingState = { error?: string };

export async function saveOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const { supabase, user } = await requireUser("/onboarding");
  const parsed = schema.safeParse({ zip: formData.get("zip"), display_name: formData.get("display_name") ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: error.message };
  redirect(safeNext(formData.get("next") as string | null));
}
