"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * MarkdownContent component renders Markdown with shadcn/ui Typography styles.
 * Uses react-markdown with custom component mapping for consistent styling.
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  // Custom component mapping for react-markdown
  // Maps Markdown elements to shadcn/ui Typography styles
  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1
        className="scroll-m-20 text-2xl font-extrabold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="scroll-m-20 border-b pb-1 text-xl font-semibold tracking-tight first:mt-0 mt-5"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="scroll-m-20 text-lg font-semibold tracking-tight mt-4"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="scroll-m-20 text-base font-semibold tracking-tight mt-3"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p className="text-sm leading-6 [&:not(:first-child)]:mt-3" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-3 ml-4 list-disc text-sm [&>li]:mt-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-3 ml-4 list-decimal text-sm [&>li]:mt-1" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mt-1" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="mt-3 border-l-2 border-border pl-4 italic text-muted-foreground text-sm"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className, node, ...props }) => {
      // Check if inline code by checking if className contains "language-"
      const isInline = !className?.includes("language-");
      
      if (isInline) {
        return (
          <code
            className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold"
            {...props}
          >
            {children}
          </code>
        );
      }
      // Block code
      return (
        <code
          className={`bg-muted relative block rounded p-3 font-mono text-xs overflow-x-auto my-3 ${className || ""}`}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className="my-3 overflow-x-auto" {...props}>
        {children}
      </pre>
    ),
    a: ({ children, ...props }) => (
      <a
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-sm"
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    hr: ({ ...props }) => (
      <hr className="my-4 border-border" {...props} />
    ),
    table: ({ children, ...props }) => (
      <div className="my-3 w-full overflow-y-auto text-sm">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-b" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="[&_tr:last-child]:border-0" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="border-b transition-colors hover:bg-muted/50" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="h-10 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="p-3 align-middle [&:has([role=checkbox])]:pr-0"
        {...props}
      >
        {children}
      </td>
    ),
  };

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
