"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlertTriangle,
  Bold,
  Code,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Quote,
  Sparkles,
} from "lucide-react";
import type { CalloutVariant } from "@/lib/calloutExtension";
import { insertImageFile, promptImageUrl } from "@/lib/imageInsert";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`toolbar-btn ${active ? "active" : ""}`}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const callout = (variant: CalloutVariant) => {
    editor.chain().focus().toggleCallout(variant).run();
  };

  const pickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await insertImageFile(editor, file);
  };

  return (
    <div className="editor-toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        hidden
        onChange={onFileChange}
      />
      <div className="toolbar-group">
        <ToolBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
        >
          <Code size={15} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("image")} onClick={pickImage} title="Upload image">
          <ImageIcon size={15} />
        </ToolBtn>
        <ToolBtn
          active={false}
          onClick={() => promptImageUrl(editor)}
          title="Image from URL"
        >
          <Link2 size={15} />
        </ToolBtn>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group toolbar-callouts">
        <span className="toolbar-label">Callouts</span>
        <ToolBtn active={editor.isActive("callout", { variant: "info" })} onClick={() => callout("info")} title="Info callout">
          <Sparkles size={14} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("callout", { variant: "tip" })} onClick={() => callout("tip")} title="Tip callout">
          <Lightbulb size={14} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("callout", { variant: "warning" })} onClick={() => callout("warning")} title="Warning callout">
          <AlertTriangle size={14} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("callout", { variant: "success" })} onClick={() => callout("success")} title="Success callout">
          <Sparkles size={14} className="callout-success-icon" />
        </ToolBtn>
      </div>
    </div>
  );
}
