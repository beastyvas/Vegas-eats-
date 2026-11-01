import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/edits", label: "Edit requests" },
  { href: "/admin/licenses", label: "Licenses" },
  { href: "/admin/import", label: "Import CSV" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="py-6">
      <nav aria-label="Admin" className="mb-6 flex flex-wrap gap-2">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="chip hover:bg-mustard">{n.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
