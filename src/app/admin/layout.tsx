import type { ReactNode } from "react";
import { requireStaffContext } from "@/modules/auth/queries";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = await requireStaffContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Panel staff
            </p>
            <h1 className="text-lg font-semibold">StudioFlow</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{profile.fullName}</p>
            <p className="text-muted-foreground">{profile.role}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
