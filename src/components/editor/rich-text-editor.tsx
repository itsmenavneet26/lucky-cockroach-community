"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JSONContent } from "@tiptap/react";

export function RichTextEditor({
  onChange,
  placeholder = "Share what you're going through…",
}: {
  onChange: (json: JSONContent, text: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-[200px] px-4 py-3 text-[15px] leading-relaxed text-ink outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getText()),
  });

  if (!editor) {
    return (
      <div className="h-[260px] animate-pulse rounded-[var(--radius)] border border-border bg-surface-2" />
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface focus-within:border-accent">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function addLink() {
    const url = window.prompt("Link URL");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  const groups = [
    [
      { icon: Bold, label: "Bold", run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
      { icon: Italic, label: "Italic", run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    ],
    [
      { icon: Heading2, label: "Heading", run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { icon: Heading3, label: "Subheading", run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    ],
    [
      { icon: List, label: "Bullet list", run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
      { icon: ListOrdered, label: "Numbered list", run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
      { icon: Quote, label: "Quote", run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
      { icon: Link2, label: "Link", run: addLink, active: editor.isActive("link") },
    ],
    [
      { icon: Undo2, label: "Undo", run: () => editor.chain().focus().undo().run(), active: false },
      { icon: Redo2, label: "Redo", run: () => editor.chain().focus().redo().run(), active: false },
    ],
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-5 w-px bg-border" />}
          {group.map(({ icon: Icon, label, run, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={run}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-[var(--radius-xs)]",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-surface-2",
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
