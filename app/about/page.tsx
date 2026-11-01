import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: "About: the no-chains rule",
  description: `${brand.name} is a locals-only food directory for Las Vegas. No chains, free listings, and nobody pays to get in.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="h-display text-4xl sm:text-5xl">No chains. That&apos;s the whole idea.</h1>
      <p className="mt-4 text-lg">
        {brand.name} is a directory of the food Las Vegas locals actually eat: home bakers, pop-ups, food trucks, and locally
        owned restaurants. If it&apos;s not locally owned, it&apos;s not on here.
      </p>

      <section aria-labelledby="rule" className="mt-10">
        <h2 id="rule" className="h-display text-2xl">What counts as “local”</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Locally owned and operated. Franchises are out.</li>
          <li>
            Brands with {appConfig.chainRule.outOfStateLocationThreshold}+ locations outside Nevada are out. A Vegas-born taco shop with five
            Vegas locations? Totally in.
          </li>
          <li>Every listing is reviewed by a human before it goes live. Software helps us find spots and flag chains; a person makes the call.</li>
        </ul>
      </section>

      <section aria-labelledby="promise" className="mt-10 rounded-3xl border-2 border-ink bg-surface p-6">
        <h2 id="promise" className="h-display text-2xl">Our promise</h2>
        <ul className="mt-3 space-y-2">
          <li><strong>Being listed is always free.</strong> Forever.</li>
          <li><strong>Money buys visibility, never inclusion.</strong> If we ever offer a paid “Featured” spot, it only moves a listing up the page. It can&apos;t get a chain in, and it can&apos;t buy vouches.</li>
          <li><strong>Featured spots still follow the no-chains rule.</strong> No exceptions.</li>
        </ul>
      </section>

      <section aria-labelledby="vouch" className="mt-10">
        <h2 id="vouch" className="h-display text-2xl">How rankings work</h2>
        <p className="mt-3">
          Locals vouch for spots they love, one vouch per person per spot. Vouches from Las Vegas Valley zip codes count fully;
          visitors&apos; count a little. “Heating up” compares each spot&apos;s activity this week to its own usual, so a new pop-up with
          momentum can outrank a 20-year institution.
        </p>
      </section>

      <section aria-labelledby="privacy" className="mt-10">
        <h2 id="privacy" className="h-display text-2xl">Home kitchens & privacy</h2>
        <p className="mt-3">
          We never publish a home address. Home sellers show only their general area, and pickup details come from the seller.
          Sellers with a verified cottage food or business license get a “Verified licensed” badge.
        </p>
      </section>

      <section id="owners" aria-labelledby="owners-h" className="mt-10 scroll-mt-6 rounded-3xl bg-green p-6 text-white">
        <h2 id="owners-h" className="h-display text-2xl">Own a spot?</h2>
        <p className="mt-3">
          Claiming your page is free: add photos, your story, hours, and “here today” updates, and see how many locals check you
          out. Find your spot, open its page, and tap <strong>Claim this page</strong>. You&apos;ll verify with a quick DM from
          your business Instagram, an emailed code, or a short manual check. Questions? Email{" "}
          <a className="underline" href={`mailto:${brand.email}`}>{brand.email}</a>.
        </p>
        <p className="mt-3">Not listed yet? <Link href="/add-a-spot" className="font-extrabold underline">Add your spot</Link>.</p>
      </section>
    </div>
  );
}
