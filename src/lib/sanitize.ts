/**
 * Server-side Tiptap JSON sanitiser.
 *
 * Tiptap is forgiving by default — feed it any JSON and it renders what
 * it can. That's a problem when the JSON comes from a user, because a
 * future extension upgrade could turn an "unknown" node into something
 * dangerous (raw HTML, embedded script, etc.).
 *
 * This sanitiser walks the JSON tree and keeps ONLY the node + mark
 * types we explicitly allow. Unknown nodes are dropped; unknown marks
 * are stripped; href attributes are validated against an allowlist of
 * URL schemes. The output is safe to store and safe to render.
 *
 * Pair with `body_text` for full-text search — the text field is the
 * source of truth for moderation, the JSON is purely presentational.
 */

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "codeBlock",
]);

const ALLOWED_MARKS = new Set(["bold", "italic", "strike", "code", "link"]);

const ALLOWED_HREF_SCHEMES = ["http:", "https:", "mailto:"];

const MAX_DEPTH = 12;
const MAX_NODES = 5000;

type TiptapNode = {
  type?: unknown;
  text?: unknown;
  attrs?: Record<string, unknown>;
  marks?: unknown[];
  content?: unknown[];
};

function sanitiseHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Reject anything that doesn't look like a parseable URL.
  try {
    const url = new URL(trimmed, "https://placeholder.invalid");
    if (!ALLOWED_HREF_SCHEMES.includes(url.protocol)) return null;
    return trimmed.length > 2048 ? null : trimmed;
  } catch {
    return null;
  }
}

function sanitiseMarks(marks: unknown): TiptapNode["marks"] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: Record<string, unknown>[] = [];
  for (const m of marks) {
    if (!m || typeof m !== "object") continue;
    const mark = m as TiptapNode;
    if (typeof mark.type !== "string" || !ALLOWED_MARKS.has(mark.type)) continue;
    if (mark.type === "link") {
      const href = sanitiseHref((mark.attrs as { href?: unknown } | undefined)?.href);
      if (!href) continue;
      out.push({ type: "link", attrs: { href, target: "_blank", rel: "noopener nofollow" } });
    } else {
      out.push({ type: mark.type });
    }
  }
  return out.length ? out : undefined;
}

function sanitiseNode(
  node: unknown,
  depth: number,
  counter: { n: number },
): TiptapNode | null {
  if (counter.n++ > MAX_NODES) return null;
  if (depth > MAX_DEPTH) return null;
  if (!node || typeof node !== "object") return null;

  const n = node as TiptapNode;
  if (typeof n.type !== "string" || !ALLOWED_NODES.has(n.type)) return null;

  const out: TiptapNode = { type: n.type };

  if (n.type === "text") {
    if (typeof n.text !== "string") return null;
    // Cap individual text node size to defang oversized payloads.
    out.text = n.text.length > 10000 ? n.text.slice(0, 10000) : n.text;
    const marks = sanitiseMarks(n.marks);
    if (marks) out.marks = marks;
    return out;
  }

  if (n.type === "heading") {
    const lvl = (n.attrs as { level?: unknown } | undefined)?.level;
    out.attrs = { level: lvl === 3 ? 3 : 2 };
  }

  if (Array.isArray(n.content)) {
    const kids: TiptapNode[] = [];
    for (const child of n.content) {
      const clean = sanitiseNode(child, depth + 1, counter);
      if (clean) kids.push(clean);
    }
    if (kids.length) out.content = kids;
  }

  return out;
}

/**
 * Sanitise a Tiptap JSON document. Always returns a valid doc node
 * (possibly empty). Never throws.
 */
export function sanitiseTiptapJson(input: unknown): { type: "doc"; content: TiptapNode[] } {
  const counter = { n: 0 };
  if (!input || typeof input !== "object") return { type: "doc", content: [] };
  const root = input as TiptapNode;
  if (root.type !== "doc" || !Array.isArray(root.content)) {
    return { type: "doc", content: [] };
  }
  const content: TiptapNode[] = [];
  for (const child of root.content) {
    const clean = sanitiseNode(child, 1, counter);
    if (clean) content.push(clean);
  }
  return { type: "doc", content };
}

/** Parse a JSON string and sanitise. Returns the empty doc on parse failure. */
export function parseAndSanitise(raw: string): { type: "doc"; content: TiptapNode[] } {
  try {
    return sanitiseTiptapJson(JSON.parse(raw));
  } catch {
    return { type: "doc", content: [] };
  }
}
