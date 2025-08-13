"use client";
import { useState } from "react";

export default function ScoreCard() {
  const [entryId, setEntryId] = useState("");
  const [gw, setGw] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ eventId: number; points: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const q = new URLSearchParams({ entryId });
      if (gw) q.set("gw", gw);
      const res = await fetch(`/api/fpl/weekly?${q.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold">Check Your Weekly Score</h2>
      <form onSubmit={onCheck} className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">FPL Team ID (Entry ID)</label>
          <input
            className="input"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            placeholder="e.g. 1234567"
            required
          />
        </div>
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
          <button className="btn w-full" disabled={loading}>
            {loading ? "Checking…" : "Check"}
          </button>
        </div>
      </form>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <p>
            Gameweek: <span className="font-medium">{data.eventId}</span>
          </p>
          <p>
            Your points:{" "}
            <span className="text-2xl font-bold">{data.points}</span>
          </p>
        </div>
      )}

      <details className="text-sm text-neutral-400">
        <summary>How to find your FPL Team ID</summary>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Log in at fantasy.premierleague.com</li>
          <li>
            Go to <em>Pick Team</em> → click <em>Gameweek History</em>
          </li>
          <li>Your Team ID is the number in the URL</li>
        </ol>
      </details>
    </div>
  );
}
