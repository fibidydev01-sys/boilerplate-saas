import { LegalSidebar } from "@/modules/landing";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <LegalSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
