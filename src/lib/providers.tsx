"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export function Providers({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      nonce={nonce}
    >
      {children}
    </ThemeProvider>
  );
}
