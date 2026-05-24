import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  ok,
  fail,
  fromZod,
  validationFail,
  mapDbError,
  mapAuthError,
  unauthenticated,
  forbidden,
  notFound,
} from "@/lib/errors";

describe("ok / fail builders", () => {
  it("ok() wraps data", () => {
    expect(ok({ x: 1 })).toEqual({ ok: true, data: { x: 1 } });
    expect(ok()).toEqual({ ok: true, data: undefined });
  });
  it("fail() builds failure", () => {
    expect(fail("validation", "msg")).toEqual({ ok: false, code: "validation", error: "msg" });
  });
  it("named guards return correct codes", () => {
    expect(unauthenticated().code).toBe("unauthenticated");
    expect(forbidden().code).toBe("forbidden");
    expect(notFound().code).toBe("not_found");
  });
});

describe("fromZod / validationFail", () => {
  it("maps zod issues to fieldErrors", () => {
    const schema = z.object({ name: z.string().min(3), age: z.number() });
    const parsed = schema.safeParse({ name: "a", age: "x" });
    if (parsed.success) throw new Error("should fail");
    const f = fromZod(parsed.error);
    expect(f.ok).toBe(false);
    expect(f.code).toBe("validation");
    expect(f.fieldErrors?.name).toBeDefined();
    expect(f.fieldErrors?.age).toBeDefined();
  });
  it("uses first issue message as top-level error", () => {
    const f = validationFail([
      { path: ["x"], message: "first", code: "custom" } as never,
      { path: ["y"], message: "second", code: "custom" } as never,
    ]);
    expect(f.error).toBe("first");
  });
});

describe("mapDbError", () => {
  it("maps unique violation to conflict", () => {
    const f = mapDbError("test", { code: "23505", message: "duplicate" });
    expect(f.code).toBe("conflict");
  });
  it("maps foreign-key violation to not_found", () => {
    const f = mapDbError("test", { code: "23503", message: "fk" });
    expect(f.code).toBe("not_found");
  });
  it("maps insufficient privilege to forbidden", () => {
    const f = mapDbError("test", { code: "42501", message: "denied" });
    expect(f.code).toBe("forbidden");
  });
  it("recognises rate-limit raise_exception", () => {
    const f = mapDbError("test", { code: "P0001", message: "rate_limit exceeded" });
    expect(f.code).toBe("rate_limited");
  });
  it("falls back to generic server error", () => {
    const f = mapDbError("test", { code: "99999", message: "unknown" });
    expect(f.code).toBe("server");
  });
  it("honours overrides", () => {
    const f = mapDbError("test", { code: "23505", message: "x" }, {
      "23505": { code: "validation", message: "Custom message" },
    });
    expect(f.code).toBe("validation");
    expect(f.error).toBe("Custom message");
  });
});

describe("mapAuthError", () => {
  it("maps invalid_credentials to validation", () => {
    const f = mapAuthError("test", { code: "invalid_credentials", message: "x" });
    expect(f.code).toBe("validation");
    expect(f.error).toMatch(/Incorrect/);
  });
  it("maps email_exists to conflict", () => {
    const f = mapAuthError("test", { code: "email_exists", message: "x" });
    expect(f.code).toBe("conflict");
  });
  it("maps rate-limit auth code", () => {
    const f = mapAuthError("test", { code: "over_email_send_rate_limit", message: "x" });
    expect(f.code).toBe("rate_limited");
  });
  it("falls through to passing message", () => {
    const f = mapAuthError("test", { code: "weird_code", message: "Specific text" });
    expect(f.error).toBe("Specific text");
  });
});
