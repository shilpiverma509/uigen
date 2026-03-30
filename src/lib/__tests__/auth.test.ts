// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("sets an httpOnly cookie with a signed JWT", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
});

test("JWT contains the correct userId and email", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("user@example.com");
});

test("cookie expiry is ~7 days in the future", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expiresMs = (options.expires as Date).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expiresMs).toBeLessThanOrEqual(before + sevenDaysMs + 1000);
});
