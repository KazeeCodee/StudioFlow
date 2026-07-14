import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Providers } from "@/lib/providers";

vi.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    nonce,
  }: {
    children: ReactNode;
    nonce?: string;
  }) => (
    <div data-testid="theme-provider" data-nonce={nonce}>
      {children}
    </div>
  ),
}));

describe("Providers", () => {
  it("propaga el nonce CSP al script de next-themes", () => {
    render(
      <Providers nonce="nonce-value">
        <span>contenido</span>
      </Providers>,
    );

    expect(screen.getByTestId("theme-provider")).toHaveAttribute(
      "data-nonce",
      "nonce-value",
    );
  });
});
