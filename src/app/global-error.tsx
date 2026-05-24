"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#fafaf9",
          color: "#0c0a09",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#dc2626",
              margin: 0,
            }}
          >
            Critical error
          </p>
          <h1
            style={{
              marginTop: 12,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            The app couldn&apos;t load
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#57534e" }}>
            Refresh the page to try again. If it keeps happening, please come
            back in a few minutes.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: 12,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 11,
                color: "#78716c",
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: 24,
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: "#0c0a09",
              color: "#fafaf9",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
