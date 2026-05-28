"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";
import {
  Type,
  BarChart3,
  ImageIcon,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { createPost, type CreatePostState } from "./actions";
// Tiptap is ~140KB minified — only load it when the user actually
// opens the submit form (and only the text-post variant uses it).
const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then((m) => ({
      default: m.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-[var(--radius)] border border-border bg-surface-2" />
    ),
  },
);
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import type { Topic, PostType } from "@/lib/types";

// A post is either a standard post (text + image + link, any combination) or
// a poll (which can also carry text + image + link, plus its options). These
// are the only two modes the composer offers; the older text/image/link split
// is preserved in the DB enum only for back-compat with existing rows.
type PostMode = "text" | "poll";
const MODES: { key: PostMode; label: string; icon: typeof Type }[] = [
  { key: "text", label: "Post", icon: Type },
  { key: "poll", label: "Poll", icon: BarChart3 },
];

const inputCls =
  "w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent";

export function SubmitForm({
  topics,
  defaultType,
  userId,
}: {
  topics: Topic[];
  defaultType: PostType;
  userId: string;
}) {
  const [state, action, pending] = useActionState<CreatePostState, FormData>(
    createPost,
    {},
  );
  const [type, setType] = useState<PostMode>(
    defaultType === "poll" ? "poll" : "text",
  );
  // React 19 auto-resets a form after its action resolves (including on a
  // validation error), which wipes any *uncontrolled* input. Keep every field
  // in state so the user's input survives a failed submit.
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [bodyJson, setBodyJson] = useState<JSONContent>({});
  const [bodyText, setBodyText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  function addTag(raw: string) {
    const slug = slugify(raw);
    if (slug && tags.length < 5 && !tags.includes(slug)) {
      setTags([...tags, slug]);
    }
    setTagInput("");
  }

  async function uploadImage(file: File) {
    setUploadError("");
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("That image is too large (max 5MB).");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: false });
    if (error) {
      const msg = error.message || "";
      if (/payload too large|file size|too large/i.test(msg)) {
        setUploadError("That image is too large (max 5MB).");
      } else if (/not allowed|denied|unauthor/i.test(msg)) {
        setUploadError("You don't have permission to upload right now.");
      } else if (/quota|limit/i.test(msg)) {
        setUploadError("Upload quota reached. Please try again later.");
      } else {
        setUploadError("Upload failed. Check your connection and try again.");
      }
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="postType" value={type} />
      <input type="hidden" name="body" value={JSON.stringify(bodyJson)} />
      <input type="hidden" name="bodyText" value={bodyText} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      {tags.map((t) => (
        <input key={t} type="hidden" name="tags" value={t} />
      ))}

      {/* Type picker */}
      <div className="flex gap-1.5 rounded-[var(--radius-lg)] border border-border bg-surface p-1.5">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] py-2 text-[13px] font-medium",
              type === key
                ? "bg-accent-soft text-accent"
                : "text-ink-soft hover:bg-surface-2",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Topic */}
      <Field label="Topic">
        <select
          name="topicId"
          required
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className={inputCls}
        >
          <option value="" disabled>
            Choose a topic…
          </option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Title */}
      <Field label={type === "poll" ? "Your question" : "Title"}>
        <input
          name="title"
          required
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder={
            type === "poll"
              ? "Ask the community something…"
              : "A clear, honest title"
          }
        />
      </Field>

      {/* Poll options — only for polls, shown right under the question. */}
      {type === "poll" && (
        <Field label="Poll options">
          <div className="flex flex-col gap-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="pollOptions"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  maxLength={120}
                  className={inputCls}
                  placeholder={`Option ${i + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPollOptions(pollOptions.filter((_, x) => x !== i))
                    }
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] border border-border text-muted hover:text-danger"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="flex items-center gap-1.5 text-[13px] font-medium text-accent"
              >
                <Plus size={15} /> Add option
              </button>
            )}
          </div>
        </Field>
      )}

      {/* Body, image, and link are all optional and can be combined freely. */}
      <Field label={type === "poll" ? "Add context (optional)" : "Your story"}>
        <RichTextEditor
          onChange={(json, text) => {
            setBodyJson(json);
            setBodyText(text);
          }}
        />
      </Field>

      <Field label="Image (optional)">
        {imageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Upload preview"
                className="max-h-80 w-full rounded-[var(--radius)] border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-2 text-sm text-muted hover:border-accent">
              {uploading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <ImageIcon size={22} />
                  <span>Click to upload an image (max 5MB)</span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
            </label>
          )}
          {uploadError && (
            <p className="mt-1 text-[12px] text-danger">{uploadError}</p>
          )}
      </Field>

      <Field label="Link (optional)">
        <input
          name="linkUrl"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className={inputCls}
          placeholder="https://…"
        />
      </Field>

      {/* Tags */}
      <Field label="Tags (optional)">
        <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius)] border border-border bg-surface px-2 py-1.5 focus-within:border-accent">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent"
            >
              #{t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                <X size={12} />
              </button>
            </span>
          ))}
          {tags.length < 5 && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder={tags.length === 0 ? "Add up to 5 tags…" : ""}
              className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-muted"
            />
          )}
        </div>
      </Field>

      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="flex h-11 items-center justify-center rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60 sm:w-44"
      >
        {pending ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {children}
    </label>
  );
}
