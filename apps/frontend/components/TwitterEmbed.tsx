"use client";

import { useEffect, useRef, useState } from "react";
import { getTwitterCanonicalUrl, parseTwitterUrl } from "@/lib/ogp/twitter";

interface TwitterEmbedProps {
  url: string;
}

interface TwitterWidgets {
  load: (element?: HTMLElement) => void;
}

declare global {
  interface Window {
    twttr?: {
      widgets?: TwitterWidgets;
    };
  }
}

const WIDGETS_SCRIPT_URL = "https://platform.x.com/widgets.js";

function loadWidgetsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${WIDGETS_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGETS_SCRIPT_URL;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Twitter widgets script"));
    document.body.appendChild(script);
  });
}

export function TwitterEmbed({ url }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  const parsed = parseTwitterUrl(url);
  const canonicalUrl = parsed ? getTwitterCanonicalUrl(parsed) : null;

  useEffect(() => {
    if (!canonicalUrl) return;

    let cancelled = false;

    loadWidgetsScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.twttr?.widgets?.load(containerRef.current);
      })
      .catch(() => setHasError(true));

    return () => {
      cancelled = true;
    };
  }, [canonicalUrl]);

  if (!parsed || hasError) return null;

  return (
    <div ref={containerRef} className="overflow-hidden">
      <blockquote className="twitter-tweet">
        <a href={canonicalUrl}>{canonicalUrl}</a>
      </blockquote>
    </div>
  );
}
