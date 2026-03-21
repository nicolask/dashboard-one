import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the main dashboard foundation heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /a dashboard foundation that can start small and grow without getting tangled/i,
      }),
    ).toBeInTheDocument();
  });

  it("includes primary navigation links", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("link", { name: /open login/i })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getAllByRole("link", { name: /view dashboard shell/i })[0]).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
