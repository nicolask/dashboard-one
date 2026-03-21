import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";

describe("LoginForm", () => {
  it("renders the login form fields", () => {
    const action = vi.fn();

    render(<LoginForm action={action} />);

    expect(screen.getByRole("heading", { level: 1, name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders an authentication error when present", () => {
    const action = vi.fn();

    render(<LoginForm action={action} errorMessage="Invalid email or password." />);

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
