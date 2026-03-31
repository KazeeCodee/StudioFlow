import type { ReactNode } from "react";
import { requireMemberContext } from "@/modules/auth/queries";

type MemberLayoutProps = {
  children: ReactNode;
};

export default async function MemberLayout({ children }: MemberLayoutProps) {
  const { profile } = await requireMemberContext();

  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <header className="border-b bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Portal miembro
            </p>
            <h1 className="text-lg font-semibold">StudioFlow</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{profile.fullName}</p>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
