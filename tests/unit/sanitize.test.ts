import { describe, it, expect } from "vitest";
import { sanitiseTiptapJson, parseAndSanitise } from "@/lib/sanitize";

describe("sanitiseTiptapJson", () => {
  it("returns empty doc for non-object input", () => {
    expect(sanitiseTiptapJson(null)).toEqual({ type: "doc", content: [] });
    expect(sanitiseTiptapJson("string")).toEqual({ type: "doc", content: [] });
    expect(sanitiseTiptapJson(42)).toEqual({ type: "doc", content: [] });
  });

  it("returns empty doc when root is not a doc", () => {
    expect(sanitiseTiptapJson({ type: "paragraph", content: [] })).toEqual({
      type: "doc",
      content: [],
    });
  });

  it("preserves allowed nodes", () => {
    const input = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hi" }] },
      ],
    };
    const out = sanitiseTiptapJson(input);
    expect(out.type).toBe("doc");
    expect(out.content[0].type).toBe("paragraph");
  });

  it("strips unknown node types", () => {
    const input = {
      type: "doc",
      content: [
        { type: "evilScript", text: "<script>" },
        { type: "paragraph", content: [{ type: "text", text: "ok" }] },
      ],
    };
    const out = sanitiseTiptapJson(input);
    expect(out.content).toHaveLength(1);
    expect(out.content[0].type).toBe("paragraph");
  });

  it("strips unknown marks", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "bold" }, { type: "evil" }],
            },
          ],
        },
      ],
    };
    const out = sanitiseTiptapJson(input) as { content: { content: { marks?: unknown[] }[] }[] };
    expect(out.content[0].content[0].marks).toEqual([{ type: "bold" }]);
  });

  it("rejects unsafe link hrefs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };
    const out = sanitiseTiptapJson(input) as { content: { content: { marks?: unknown[] }[] }[] };
    expect(out.content[0].content[0].marks ?? []).toEqual([]);
  });

  it("accepts safe link hrefs and forces rel/target", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "https://example.com" } }],
            },
          ],
        },
      ],
    };
    const out = sanitiseTiptapJson(input) as { content: { content: { marks?: unknown[] }[] }[] };
    expect(out.content[0].content[0].marks[0]).toEqual({
      type: "link",
      attrs: { href: "https://example.com", target: "_blank", rel: "noopener nofollow" },
    });
  });

  it("normalises heading levels to 2 or 3 only", () => {
    const out = sanitiseTiptapJson({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 99 }, content: [{ type: "text", text: "x" }] }],
    }) as { content: { attrs?: { level?: number } }[] };
    expect(out.content[0].attrs?.level).toBe(2);
  });

  it("caps depth", () => {
    let nested: { type: string; text?: string; content?: unknown[] } = { type: "text", text: "deep" };
    for (let i = 0; i < 50; i++) nested = { type: "paragraph", content: [nested] };
    const out = sanitiseTiptapJson({ type: "doc", content: [nested] });
    expect(out.type).toBe("doc");
  });
});

describe("parseAndSanitise", () => {
  it("returns empty doc on invalid JSON", () => {
    expect(parseAndSanitise("not json")).toEqual({ type: "doc", content: [] });
  });
  it("parses and sanitises valid JSON", () => {
    const out = parseAndSanitise(JSON.stringify({ type: "doc", content: [] }));
    expect(out).toEqual({ type: "doc", content: [] });
  });
});
