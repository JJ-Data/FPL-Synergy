"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    entryId: "",
    adminPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    const [p, a] = await Promise.all([
      fetch("/api/users?status=PENDING").then((r) => r.json()),
      fetch("/api/users?status=APPROVED").then((r) => r.json()),
    ]);
    setPending(p);
    setApproved(a);
  }
  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, entryId: Number(form.entryId) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setOk("User added as APPROVED");
      setForm({
        name: "",
        email: "",
        company: "",
        entryId: "",
        adminPassword: "",
      });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: number, adminPassword: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", adminPassword }),
    });
    if (res.ok) load();
  }
  async function block(id: number, adminPassword: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "BLOCKED", adminPassword }),
    });
    if (res.ok) load();
  }
  async function remove(id: number, adminPassword: string) {
    const res = await fetch(
      `/api/users/${id}?adminPassword=${encodeURIComponent(adminPassword)}`,
      { method: "DELETE" }
    );
    if (res.ok) load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin – Manage Participants</h1>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">
          Add Approved Participant (Admin only)
        </h2>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
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
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
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
            <label className="label">Admin password</label>
            <input
              className="input"
              type="password"
              value={form.adminPassword}
              onChange={(e) =>
                setForm((s) => ({ ...s, adminPassword: e.target.value }))
              }
              required
            />
          </div>
          <div className="sm:col-span-2 flex gap-2 items-center">
            <button className="btn" disabled={loading}>
              {loading ? "Adding…" : "Add user (Approved)"}
            </button>
            {ok && <span className="text-green-400 text-sm">{ok}</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
          <table className="w-full text-sm">
            <thead className="text-neutral-300">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Entry</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r: any) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="py-2 pr-2">{r.name}</td>
                  <td className="py-2 pr-2">{r.email}</td>
                  <td className="py-2 pr-2">{r.entryId}</td>
                  <td className="py-2 pr-2 flex gap-2">
                    <button
                      className="btn"
                      onClick={() => approve(r.id, form.adminPassword)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn"
                      onClick={() => block(r.id, form.adminPassword)}
                    >
                      Block
                    </button>
                    <button
                      className="btn"
                      onClick={() => remove(r.id, form.adminPassword)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-neutral-400" colSpan={4}>
                    No pending requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Approved Participants</h2>
          <table className="w-full text-sm">
            <thead className="text-neutral-300">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Entry</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((r: any) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="py-2 pr-2">{r.name}</td>
                  <td className="py-2 pr-2">{r.email}</td>
                  <td className="py-2 pr-2">{r.entryId}</td>
                  <td className="py-2 pr-2 flex gap-2">
                    <button
                      className="btn"
                      onClick={() => block(r.id, form.adminPassword)}
                    >
                      Block
                    </button>
                    <button
                      className="btn"
                      onClick={() => remove(r.id, form.adminPassword)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-neutral-400" colSpan={4}>
                    No approved users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
