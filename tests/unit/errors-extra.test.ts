import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mapDbError, mapAuthError } from "@/lib/errors";

// Silence the structured [db-error] log line so the test output stays
// readable — we only care about the returned ActionFailure shape.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("mapDbError — additional codes", () => {
  it("maps NOT_NULL violation to validation", () => {
    expect(mapDbError("t", { code: "23502", message: "null" }).code).toBe("validation");
  });

  it("maps CHECK violation to validation", () => {
    expect(mapDbError("t", { code: "23514", message: "check" }).code).toBe("validation");
  });

  it("maps STRING_RIGHT_TRUNCATION to validation (too long)", () => {
    const f = mapDbError("t", { code: "22001", message: "too long" });
    expect(f.code).toBe("validation");
    expect(f.error).toMatch(/too long/i);
  });

  it("maps PGRST116 not-found to not_found", () => {
    expect(mapDbError("t", { code: "PGRST116", message: "no row" }).code).toBe("not_found");
  });

  it("maps PostgREST JWT expired to unauthenticated", () => {
    expect(mapDbError("t", { code: "PGRST301", message: "jwt" }).code).toBe("unauthenticated");
  });

  it("maps undefined function (42883) to unavailable", () => {
    expect(mapDbError("t", { code: "42883", message: "fn" }).code).toBe("unavailable");
  });

  it("maps undefined table (42P01) to unavailable", () => {
    expect(mapDbError("t", { code: "42P01", message: "rel" }).code).toBe("unavailable");
  });

  it("maps PostgREST fn-not-found (PGRST202) to unavailable", () => {
    expect(mapDbError("t", { code: "PGRST202", message: "schema cache" }).code).toBe("unavailable");
  });

  it("maps PostgREST rel-not-found (PGRST205) to unavailable", () => {
    expect(mapDbError("t", { code: "PGRST205", message: "schema cache" }).code).toBe("unavailable");
  });

  it("includes scope ref in generic server fallback", () => {
    const f = mapDbError("comment.insert", { code: "99999", message: "?" });
    expect(f.code).toBe("server");
    expect(f.error).toMatch(/comment\.insert/);
  });

  it("RAISE_EXCEPTION (P0001) without rate-limit text humanises message", () => {
    const f = mapDbError("t", { code: "P0001", message: "ERROR:  custom rule failed" });
    expect(f.code).toBe("server");
    expect(f.error).toBe("custom rule failed");
  });

  it("RAISE_EXCEPTION caps very long messages", () => {
    const long = "ERROR:  " + "x".repeat(300);
    const f = mapDbError("t", { code: "P0001", message: long });
    expect(f.error.endsWith("…")).toBe(true);
    expect(f.error.length).toBeLessThanOrEqual(160);
  });
});

describe("mapAuthError — additional codes", () => {
  it("maps email_not_confirmed to forbidden", () => {
    expect(mapAuthError("t", { code: "email_not_confirmed", message: "" }).code).toBe("forbidden");
  });
  it("maps user_already_exists to conflict", () => {
    expect(mapAuthError("t", { code: "user_already_exists", message: "" }).code).toBe("conflict");
  });
  it("maps weak_password to validation", () => {
    expect(mapAuthError("t", { code: "weak_password", message: "x" }).code).toBe("validation");
  });
  it("maps over_request_rate_limit to rate_limited", () => {
    expect(mapAuthError("t", { code: "over_request_rate_limit", message: "" }).code).toBe("rate_limited");
  });
  it("maps signup_disabled to forbidden", () => {
    expect(mapAuthError("t", { code: "signup_disabled", message: "" }).code).toBe("forbidden");
  });
  it("maps user_not_found to not_found", () => {
    expect(mapAuthError("t", { code: "user_not_found", message: "" }).code).toBe("not_found");
  });
  it("maps same_password to validation", () => {
    expect(mapAuthError("t", { code: "same_password", message: "" }).code).toBe("validation");
  });
  it("unknown code falls through with provided message", () => {
    expect(mapAuthError("t", { code: undefined, message: "explicit text" }).error).toBe("explicit text");
  });
});
