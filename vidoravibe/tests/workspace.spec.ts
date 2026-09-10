import { test, expect, type Page } from "@playwright/test";
const job = { _id: "job-test", source_type: "GCS", source_url: "https://storage.googleapis.com/test/video.mp4", source_identifier: "gcs", status: "QUEUED", current_stage: "QUEUED", progress: 0, created_at: "2026-09-10T00:00:00Z", updated_at: "2026-09-10T00:00:00Z" };
async function api(page: Page, callback?: (path: string, method: string) => unknown) {
  await page.addInitScript(() => localStorage.setItem("token", "test-existing-token"));
  await page.route("**/api/v1/**", async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = callback?.(path, route.request().method());
    if (data === undefined) {
      if (path.endsWith("/auth/session")) data = { user_id: "alice" };
      else if (path.endsWith("/vibe-jobs") && route.request().method() === "GET") data = { jobs: [], next_cursor: null };
      else if (path.endsWith("/vibe-jobs") && route.request().method() === "POST") {
        expect(route.request().headers()["authorization"]).toBe("Bearer test-existing-token");
        expect(route.request().headers()["idempotency-key"]).toBeTruthy();
        data = { job, duplicate: false };
      } else if (path.endsWith("/vibes")) data = { vibes: [] };
      else data = job;
    }
    await route.fulfill({ json: { success: true, data, error: null } });
  });
}

test("creator workspace submits authenticated cloud jobs", async ({ page }) => {
  await api(page);
  await page.goto("/vibes/create");
  await expect(page.getByRole("heading", { name: "Long story. Great shorts." })).toBeVisible();
  await page.screenshot({ path: "test-results/creator-workspace.png", fullPage: true });
  await page.getByRole("textbox", { name: "Google Cloud video URL" }).fill("https://storage.googleapis.com/test/video.mp4");
  await page.getByRole("button", { name: "Find my best moments" }).click();
  await expect(page).toHaveURL(/vibes\/jobs\/job-test/);
  await expect(page.getByRole("heading", { name: "Finding the good parts." })).toBeVisible();
});

test("invalid links stay in the workspace and show a useful error", async ({ page }) => {
  await api(page);
  await page.goto("/vibes/create");
  await page.getByRole("textbox", { name: "Google Cloud video URL" }).fill("http://169.254.169.254/private");
  await page.getByRole("button", { name: "Find my best moments" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Google Cloud Storage" })).toBeVisible();
});

test("direct upload creates a job from the completed upload ID", async ({ page }) => {
  let submitted = false;
  await api(page, (path, method) => {
    if (path.endsWith("/uploads")) return { upload_id: "upload-test", upload_url: "https://storage.googleapis.com/test/upload-session", chunk_bytes: 8 * 1024 * 1024 };
    if (path.endsWith("/vibe-jobs") && method === "POST") submitted = true;
  });
  await page.route("https://storage.googleapis.com/test/upload-session", route => route.fulfill({ status: 200, body: "{}" }));
  await page.goto("/vibes/create");
  await page.getByRole("button", { name: "Upload a video" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "recording.mp4", mimeType: "video/mp4", buffer: Buffer.from("test fixture") });
  await page.getByRole("button", { name: "Find my best moments" }).click();
  await expect(page).toHaveURL(/vibes\/jobs\/job-test/);
  expect(submitted).toBe(true);
});

test("polling reaches completion and stops", async ({ page }) => {
  let polls = 0;
  await api(page, path => {
    if (path.endsWith("/vibe-jobs/job-test")) {
      polls++;
      return polls > 1 ? { ...job, status: "COMPLETED", current_stage: "COMPLETED", progress: 100 } : job;
    }
  });
  await page.goto("/vibes/jobs/job-test");
  await expect(page.getByRole("heading", { name: "Your moments are ready." })).toBeVisible();
  await page.waitForTimeout(3500);
  expect(polls).toBe(2);
});

test("signed-out users can use their existing account", async ({ page }) => {
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/session")) return route.fulfill({ status: 401, json: { success: false, data: null, error: { code: "HTTP_401", message: "Sign in" } } });
    const data = path.endsWith("/login") ? { token: "existing-account-token" } : { jobs: [], next_cursor: null };
    await route.fulfill({ json: { success: true, data, error: null } });
  });
  await page.goto("/vibes/create");
  await page.getByLabel("Email", { exact: true }).fill("creator@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Continue with VidoraHub" }).click();
  await expect(page.getByRole("heading", { name: "Long story. Great shorts." })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBe("existing-account-token");
});

test("transcription shows processed audio and elapsed time", async ({ page }) => {
  await api(page, path => {
    if (path.endsWith("/vibe-jobs/job-test")) return {
      ...job, status: "TRANSCRIBING", current_stage: "TRANSCRIBING", progress: 33,
      transcription: { phase: "transcribing", processed_seconds: 80, total_seconds: 180, elapsed_seconds: 35 },
    };
  });
  await page.goto("/vibes/jobs/job-test");
  await expect(page.getByRole("status")).toContainText("Transcribed 1:20 of 3:00");
  await expect(page.getByRole("status")).toContainText("Elapsed 0:35");
});
