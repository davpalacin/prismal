"use client";

import { useState, type FormEvent } from "react";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "ok"; ref: string } | { kind: "error"; msg: string };

export function FollowForm({ cta }: { cta: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setState({ kind: "error", msg: "Enter a valid email address." });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setState({ kind: "ok", ref: data.reference });
      form.reset();
    } catch (err) {
      setState({ kind: "error", msg: err instanceof Error ? err.message : "Request failed." });
    }
  }

  if (state.kind === "ok") {
    return (
      <div className="access access--ok" role="status">
        <p className="mono access__k">
          <span className="pulse" aria-hidden="true" /> Request logged
        </p>
        <p className="access__msg">You are on the development list. Updates will be released as the project evolves.</p>
        <p className="mono access__ref">Reference: {state.ref}</p>
      </div>
    );
  }

  return (
    <form className="access" onSubmit={onSubmit} noValidate>
      <label htmlFor="access-email" className="mono access__k">
        Email address
      </label>
      <div className="access__row">
        <input
          id="access-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@domain.com"
          required
          aria-invalid={state.kind === "error"}
          aria-describedby="access-help"
        />
        <button type="submit" className="btn btn--primary" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Transmitting…" : cta}
        </button>
      </div>
      <p id="access-help" className={`mono access__help ${state.kind === "error" ? "is-error" : ""}`} aria-live="polite">
        {state.kind === "error" ? state.msg : "Occasional development updates only. No spam. Unsubscribe anytime."}
      </p>
    </form>
  );
}
