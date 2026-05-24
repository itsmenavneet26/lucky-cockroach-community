import { describe, it, expect } from "vitest";
import { cn, slugify, timeAgo, formatCount } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("handles conditional values", () => {
    expect(cn("a", false && "b", null, "c")).toBe("a c");
  });
});

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });
  it("collapses repeated dashes", () => {
    expect(slugify("a -- b")).toBe("a-b");
  });
  it("trims leading/trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });
  it("caps at 40 chars", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(40);
  });
  it("returns empty for non-ascii-only input", () => {
    expect(slugify("こんにちは")).toBe("");
  });
});

describe("timeAgo", () => {
  it('returns "just now" for very recent dates', () => {
    expect(timeAgo(new Date())).toBe("just now");
  });
  it("returns minutes ago", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60 * 1000))).toMatch(/m ago/);
  });
  it("returns hours ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600 * 1000))).toMatch(/h ago/);
  });
  it("accepts ISO strings", () => {
    expect(timeAgo(new Date(Date.now() - 60_000).toISOString())).toMatch(/m ago|just now/);
  });
});

describe("formatCount", () => {
  it("returns raw for <1000", () => {
    expect(formatCount(42)).toBe("42");
    expect(formatCount(999)).toBe("999");
  });
  it("uses k suffix for thousands", () => {
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(12000)).toBe("12k");
  });
  it("uses M suffix for millions", () => {
    expect(formatCount(2_500_000)).toBe("2.5M");
    expect(formatCount(1_000_000)).toBe("1M");
  });
});
