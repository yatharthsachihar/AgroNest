import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle, FontFamily, Color, FontSize } from "@tiptap/extension-text-style";
import "./rich-text-editor.css";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="rte-toolbar">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
      >
        Bold
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
      >
        Italic
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "is-active" : ""}
      >
        Strike
      </button>
      
      <span style={{ width: 1, background: "var(--border)", margin: "4px" }} />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
        className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
      >
        H1
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
      >
        H2
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
        className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
      >
        H3
      </button>

      <span style={{ width: 1, background: "var(--border)", margin: "4px" }} />

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
        className={editor.isActive("bulletList") ? "is-active" : ""}
      >
        Bullet List
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
        className={editor.isActive("orderedList") ? "is-active" : ""}
      >
        Numbered List
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
        className={editor.isActive("blockquote") ? "is-active" : ""}
      >
        Quote
      </button>

      <span style={{ width: 1, background: "var(--border)", margin: "4px" }} />

      <button
        onClick={(e) => {
          e.preventDefault();
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive("link") ? "is-active" : ""}
      >
        Link
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          const url = window.prompt('Image URL');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      >
        Image
      </button>

      <span style={{ width: 1, background: "var(--border)", margin: "4px" }} />

      <button onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }} disabled={!editor.can().chain().focus().undo().run()}>
        Undo
      </button>
      <button onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }} disabled={!editor.can().chain().focus().redo().run()}>
        Redo
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, label, error, minHeight = 200 }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      FontFamily,
      Color,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with external value changes (e.g., when editing a different item)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  return (
    <div className={`form-group`}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
          {label}
        </label>
      )}
      <div className={`rte-container ${error ? "input-error" : ""}`}>
        <MenuBar editor={editor} />
        <EditorContent editor={editor} className="rte-content" style={{ minHeight }} />
      </div>
      {error && <span className="input-error-text" style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</span>}
    </div>
  );
}
