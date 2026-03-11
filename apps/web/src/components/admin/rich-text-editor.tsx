"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const apply = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => apply("bold")}>
          Kalın
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply("italic")}>
          İtalik
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply("insertUnorderedList")}>
          Liste
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => apply("formatBlock", "h2")}>
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const url = prompt("Link URL");
            if (url) apply("createLink", url);
          }}
        >
          Link
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[220px] rounded border bg-background p-3 text-sm focus:outline-none"
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
      />
    </div>
  );
}
