"use client";

/** Last resort when the root of the app fails. It replaces the whole page, so it carries no providers and uses inline styles only. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#1a1d23", background: "#f7f8fa" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>EduMaps.kg</h1>
          <p style={{ maxWidth: 420, lineHeight: 1.5 }}>
            Бир нерсе туура эмес болду. Кайра аракет кылыңыз.<br />
            Что-то пошло не так. Попробуйте ещё раз.<br />
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 8, padding: "10px 20px", border: 0, borderRadius: 8, background: "#185078", color: "#fff", fontSize: 16, cursor: "pointer" }}
          >
            ↻
          </button>
        </main>
      </body>
    </html>
  );
}
