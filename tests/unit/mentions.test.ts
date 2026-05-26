import { describe, it, expect } from "vitest";
import { extractMentions } from "@/lib/mentions";

describe("extractMentions", () => {
  it("returns [] for empty / no mentions", () => {
    expect(extractMentions("")).toEqual([]);
    expect(extractMentions("hello world")).toEqual([]);
  });

  it("extracts a single mention", () => {
    expect(extractMentions("hi @alice")).toEqual(["alice"]);
  });

  it("extracts multiple mentions in order", () => {
    expect(extractMentions("@alice and @bob")).toEqual(["alice", "bob"]);
  });

  it("lowercases mentions", () => {
    expect(extractMentions("@Alice @BOB")).toEqual(["alice", "bob"]);
  });

  it("deduplicates", () => {
    expect(extractMentions("@alice @alice @Alice")).toEqual(["alice"]);
  });

  it("ignores names shorter than 3 chars", () => {
    expect(extractMentions("@a @ab @abc")).toEqual(["abc"]);
  });

  it("caps names at 20 chars (the 21st char is dropped)", () => {
    // matches the first 20 chars; trailing 'z' is not in the username
    const longer = "@" + "a".repeat(25);
    expect(extractMentions(longer)).toEqual(["a".repeat(20)]);
  });

  it("accepts underscores and digits", () => {
    expect(extractMentions("@user_1 @two_2_two")).toEqual(["user_1", "two_2_two"]);
  });

  it("does not match emails like foo@bar — but still grabs `bar`", () => {
    // documents current behaviour: regex doesn't require a word boundary before @
    expect(extractMentions("email me at foo@bar.com")).toEqual(["bar"]);
  });

  it("caps at 10 unique mentions", () => {
    const text = Array.from({ length: 15 }, (_, i) => `@user${i}`).join(" ");
    expect(extractMentions(text)).toHaveLength(10);
  });
});
