import { test, expect } from "@playwright/test";

test.describe("Event Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth state
    await page.goto("/login");
    await page.fill('[placeholder="Phone Number"]', "+1234567890");
    await page.click('button:has-text("Send Code")');
    await page.fill('[placeholder="Verification Code"]', "123456");
    await page.click('button:has-text("Verify")');
    
    // Wait for redirect to events page
    await page.waitForURL("/events");
  });

  test("complete event creation and invitation flow", async ({ page }) => {
    // Create new event
    await page.click('button:has-text("Create Event")');
    await page.fill('[placeholder="Event Title"]', "Birthday Party");
    await page.fill('[placeholder="Description"]', "Join us for a celebration!");
    await page.fill('[placeholder="Location"]', "123 Party St");
    await page.fill('[placeholder="Date and Time"]', "2024-12-31T19:00");
    await page.click('button:has-text("Create")');

    // Verify event was created
    await expect(page.getByText("Birthday Party")).toBeVisible();
    await expect(page.getByText("Join us for a celebration!")).toBeVisible();

    // Open event details
    await page.click('text="Birthday Party"');
    await expect(page.url()).toContain("/events/");

    // Send invitation
    await page.click('button:has-text("Invite Guest")');
    await page.fill('[placeholder="Phone Number"]', "+1987654321");
    await page.click('button:has-text("Send Invitation")');

    // Verify invitation was sent
    await expect(page.getByText("+1987654321")).toBeVisible();
    await expect(page.getByText("pending")).toBeVisible();

    // Simulate RSVP response (in a real test, this would be a separate user flow)
    const inviteUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/rsvp/"]');
      return link ? link.getAttribute("href") : null;
    });

    if (inviteUrl) {
      await page.goto(inviteUrl);
      await page.click('button:has-text("Accept")');
      
      // Verify RSVP was recorded
      await page.goto("/events");
      await page.click('text="Birthday Party"');
      await expect(page.getByText("accepted")).toBeVisible();
    }
  });

  test("handles validation errors", async ({ page }) => {
    await page.click('button:has-text("Create Event")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Create")');
    
    // Verify validation errors
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();
    await expect(page.getByText("Location is required")).toBeVisible();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Simulate offline state
    await page.route("**/api/**", (route) => route.abort());
    
    await page.click('button:has-text("Create Event")');
    await page.fill('[placeholder="Event Title"]', "Test Event");
    await page.click('button:has-text("Create")');
    
    // Verify error message
    await expect(page.getByText(/failed.*try again/i)).toBeVisible();
  });
});
