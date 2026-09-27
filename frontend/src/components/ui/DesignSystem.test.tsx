import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, Badge, Button, EmptyState, Field, Heading, IconButton, Progress, Spinner, Text } from "./DesignSystem";

describe("design system primitives (#967, #968)", () => {
  it("renders accessible status and action variants", () => {
    render(<><Badge tone="success">Healthy</Badge><Alert tone="danger">Failure</Alert><Button>Continue</Button><Field label="Wallet" error="Required" /></>);
    expect(screen.getByText("Healthy")).toHaveClass("ds-badge--success");
    expect(screen.getByRole("status")).toHaveClass("ds-alert--danger");
    expect(screen.getByRole("button")).toHaveClass("ds-button--primary");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("provides consistent feedback and content primitives", () => {
    render(<><Heading level={3}>Overview</Heading><Text tone="muted">Updated now</Text><Progress value={150} /><Spinner /><EmptyState title="Nothing here">Try another filter</EmptyState><IconButton label="Close">×</IconButton></>);
    expect(screen.getByRole("heading", { name: "Overview" })).toHaveClass("ds-heading--3");
    expect(screen.getByLabelText("100% complete")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("ds-icon-button");
  });
});
