import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your spots", robots: { index: false, follow: false } };

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <div className="py-6">{children}</div>;
}
