"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard unavailable — the readonly input is still there to copy from.
        }
      }}
      className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
