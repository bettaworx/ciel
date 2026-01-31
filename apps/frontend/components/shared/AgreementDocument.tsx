"use client";

import { MarkdownContent } from "./MarkdownContent";

interface AgreementDocumentProps {
  content: string;
  title: string;
}

export function AgreementDocument({ content, title }: AgreementDocumentProps) {
  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full overflow-y-auto rounded-lg bg-background p-6">
        <article className="max-w-none">
          <MarkdownContent content={content} />
        </article>
      </div>
    </div>
  );
}
