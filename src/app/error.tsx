"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground">
        We couldn’t load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-outline rounded px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </section>
  );
}
