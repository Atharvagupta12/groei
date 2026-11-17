"use client";

// Last-resort boundary for errors thrown by the root layout itself.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#101114",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Groei hit an unexpected error</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>Please reload the page.</p>
        <button
          onClick={reset}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
