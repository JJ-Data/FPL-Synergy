"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    entryId: "",
  });
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, entryId: Number(form.entryId) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setOk("Submitted! Admin will review and approve you soon.");
      setForm({ name: "", email: "", company: "", entryId: "" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Join the Company FPL League</h1>
      <p className="text-neutral-300">
        Fill this form to request access. Admin approval is required before you
        appear on the leaderboard.
      </p>
      <form onSubmit={onSubmit} className="card grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Company (optional)</label>
          <input
            className="input"
            value={form.company}
            onChange={(e) =>
              setForm((s) => ({ ...s, company: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">FPL Team ID (Entry ID)</label>
          <input
            className="input"
            value={form.entryId}
            onChange={(e) =>
              setForm((s) => ({ ...s, entryId: e.target.value }))
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button className="btn w-full" disabled={loading}>
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
        {ok && <p className="sm:col-span-2 text-green-400 text-sm">{ok}</p>}
        {err && <p className="sm:col-span-2 text-red-400 text-sm">{err}</p>}
      </form>
    </div>
  );
}
