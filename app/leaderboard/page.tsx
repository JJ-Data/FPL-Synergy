"use client";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [gw, setGw] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (gw) q.set("gw", gw);
      const res = await fetch(`/api/leaderboard?${q.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setRows(json.leaderboard);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
      <div className="card space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Gameweek (optional)</label>
            <input
              className="input"
              value={gw}
              onChange={(e) => setGw(e.target.value)}
              placeholder="leave blank: current"
            />
          </div>
          <div className="flex items-end">
            <button className="btn w-full" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-300">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Company</th>
                <th className="text-left py-2">Entry ID</th>
                <th className="text-right py-2">GW Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.entryId} className="border-t border-neutral-800">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2">{r.name}</td>
                  <td className="py-2 pr-2">{r.company ?? "-"}</td>
                  <td className="py-2 pr-2">{r.entryId}</td>
                  <td className="py-2 pr-2 text-right font-semibold">
                    {r.points}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400">
                    No users yet. Ask Admin to add participants.
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
