"use client";
import { useEffect, useState } from "react";

function ym(d = new Date()) {
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

export default function MonthlyPage() {
  const now = ym();
  const [year, setYear] = useState(now.y);
  const [month, setMonth] = useState(now.m);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/monthly?year=${year}&month=${month}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function exportCSV() {
    if (!data?.leaderboard) return;
    const rows = data.leaderboard;
    const header = [
      "Rank",
      "Name",
      "Email",
      "Company",
      "EntryID",
      "MonthPoints",
      "SeasonTotal",
    ];
    const body = rows.map((r: any) => [
      r.rank,
      r.name,
      r.email,
      r.company || "",
      r.entryId,
      r.monthPoints,
      r.seasonTotal,
    ]);
    const lines = [header, ...body].map((cols) =>
      cols
        .map((v) => {
          const s = String(v ?? "");
          // Escape CSV: wrap in quotes if needed and escape inner quotes
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly_${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monthly Leaderboard</h1>
      <div className="card grid sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Month (1–12)</label>
          <input
            className="input"
            type="number"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Load"}
        </button>
        <button
          className="btn"
          onClick={exportCSV}
          disabled={!data?.leaderboard?.length}
        >
          Export CSV
        </button>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      {data?.winner && (
        <div className="card">
          <h2 className="text-lg font-semibold">Top Performer</h2>
          <p className="mt-1">
            Winner: <span className="font-medium">{data.winner.name}</span>{" "}
            (Entry {data.winner.entryId}) –{" "}
            <span className="font-bold">{data.winner.monthPoints}</span> pts
          </p>
          <p className="text-neutral-400 text-sm">
            Tie-breakers: season total → GW wins → random (if still tied)
          </p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-neutral-300">
            <tr>
              <th className="text-left py-2">Rank</th>
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Company</th>
              <th className="text-left py-2">Entry ID</th>
              <th className="text-right py-2">Month Points</th>
              <th className="text-right py-2">Season Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.leaderboard?.map((r: any) => (
              <tr key={r.entryId} className="border-t border-neutral-800">
                <td className="py-2 pr-2">{r.rank}</td>
                <td className="py-2 pr-2">{r.name}</td>
                <td className="py-2 pr-2">{r.company ?? "-"}</td>
                <td className="py-2 pr-2">{r.entryId}</td>
                <td className="py-2 pr-2 text-right font-semibold">
                  {r.monthPoints}
                </td>
                <td className="py-2 pr-2 text-right">{r.seasonTotal}</td>
              </tr>
            ))}
            {!data?.leaderboard?.length && !loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">
                  No data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
