"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

/** Read-only renderer for Tiptap post/comment bodies. */
export function RichText({
  content,
  className,
}: {
  content: JSONContent;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: true }),
    ],
    content,
    editorProps: {
      attributes: { class: `rich-text ${className ?? ""}` },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
