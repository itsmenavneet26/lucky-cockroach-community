import { describe, it, expect } from "vitest";
import { isSafeExternalUrl } from "@/lib/url-safety";

describe("isSafeExternalUrl", () => {
  it("accepts standard https URLs", () => {
    expect(isSafeExternalUrl("https://example.com")).toBe(true);
    expect(isSafeExternalUrl("https://www.nta.ac.in/notice")).toBe(true);
  });
  it("accepts standard http URLs", () => {
    expect(isSafeExternalUrl("http://example.com")).toBe(true);
  });
  it("rejects non-http(s) schemes", () => {
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeExternalUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.com")).toBe(false);
  });
  it("rejects localhost and loopback", () => {
    expect(isSafeExternalUrl("http://localhost")).toBe(false);
    expect(isSafeExternalUrl("http://127.0.0.1")).toBe(false);
    expect(isSafeExternalUrl("http://[::1]")).toBe(false);
  });
  it("rejects cloud metadata endpoints", () => {
    expect(isSafeExternalUrl("http://169.254.169.254/")).toBe(false);
    expect(isSafeExternalUrl("http://metadata.google.internal/")).toBe(false);
  });
  it("rejects RFC1918 private ranges", () => {
    expect(isSafeExternalUrl("http://10.0.0.1")).toBe(false);
    expect(isSafeExternalUrl("http://192.168.1.1")).toBe(false);
    expect(isSafeExternalUrl("http://172.16.0.1")).toBe(false);
    expect(isSafeExternalUrl("http://172.31.255.255")).toBe(false);
  });
  it("accepts non-private public IPs in 172.x range", () => {
    expect(isSafeExternalUrl("http://172.15.0.1")).toBe(true);
    expect(isSafeExternalUrl("http://172.32.0.1")).toBe(true);
  });
  it("rejects .local and .internal TLDs", () => {
    expect(isSafeExternalUrl("http://service.local")).toBe(false);
    expect(isSafeExternalUrl("http://api.internal")).toBe(false);
  });
  it("rejects IPv6 literals (defence-in-depth)", () => {
    expect(isSafeExternalUrl("http://[2001:db8::1]")).toBe(false);
  });
  it("rejects empty, malformed, oversized inputs", () => {
    expect(isSafeExternalUrl("")).toBe(false);
    expect(isSafeExternalUrl("not a url")).toBe(false);
    expect(isSafeExternalUrl("https://example.com/" + "a".repeat(3000))).toBe(false);
  });
  it("rejects non-string inputs", () => {
    // @ts-expect-error testing runtime safety
    expect(isSafeExternalUrl(null)).toBe(false);
    // @ts-expect-error testing runtime safety
    expect(isSafeExternalUrl(123)).toBe(false);
  });
});
