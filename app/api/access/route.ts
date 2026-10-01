import { NextResponse } from "next/server";

/**
 * Development-access requests.
 * Currently validates and acknowledges the request. Connect a mailing-list
 * provider (e.g. via an env-configured webhook) where marked below.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  const webhook = process.env.PRISMAL_ACCESS_WEBHOOK;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "prismal-site", at: new Date().toISOString() }),
    }).catch(() => null);
    if (!res || !res.ok) {
      return NextResponse.json({ error: "Transmission failed. Try again shortly." }, { status: 502 });
    }
  }

  const reference = `PRSM-ACC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  return NextResponse.json({ ok: true, reference });
}
