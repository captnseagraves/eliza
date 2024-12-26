import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import { EventForm } from "../EventForm";
import { createEventSchema } from "@/shared/types/event";

describe("EventForm", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it("renders form fields correctly", () => {
    render(
      <EventForm
        onSubmit={mockSubmit}
        isLoading={false}
        validationSchema={createEventSchema}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date and time/i)).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(
      <EventForm
        onSubmit={mockSubmit}
        isLoading={false}
        validationSchema={createEventSchema}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const validEvent = {
      title: "Test Event",
      description: "Test Description",
      location: "Test Location",
      dateTime: new Date().toISOString(),
    };

    render(
      <EventForm
        onSubmit={mockSubmit}
        isLoading={false}
        validationSchema={createEventSchema}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: validEvent.title },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: validEvent.description },
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: validEvent.location },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: validEvent.dateTime },
    });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(validEvent);
    });
  });

  it("disables form submission when loading", () => {
    render(
      <EventForm
        onSubmit={mockSubmit}
        isLoading={true}
        validationSchema={createEventSchema}
      />
    );

    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });
});
