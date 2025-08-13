"use client";
import { useState } from "react";

interface ScoreData {
  eventId: number;
  points: number;
}

export default function ScoreCard() {
  const [entryId, setEntryId] = useState("");
  const [gw, setGw] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();

    if (!entryId.trim()) {
      setError("Please enter your FPL Team ID");
      return;
    }

    // Basic validation for entry ID
    const entryIdNum = Number(entryId);
    if (isNaN(entryIdNum) || entryIdNum < 1 || entryIdNum > 10000000) {
      setError("Please enter a valid FPL Team ID (1-10000000)");
      return;
    }

    setError(null);
    setLoading(true);
    setData(null);

    try {
      const params = new URLSearchParams({ entryId });
      if (gw.trim()) {
        const gwNum = Number(gw);
        if (isNaN(gwNum) || gwNum < 1 || gwNum > 38) {
          throw new Error("Gameweek must be between 1 and 38");
        }
        params.set("gw", gw);
      }

      const res = await fetch(`/api/fpl/weekly?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Server error (${res.status})`);
      }

      setData(json);
    } catch (e: any) {
      console.error("Score check error:", e);
      setError(e.message || "Failed to fetch your score. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearResults() {
    setData(null);
    setError(null);
  }

  return (
    <div className="card space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          🔍 Check Your Weekly Score
        </h2>
        <p className="text-neutral-400 text-sm">
          Enter your FPL Team ID to see your current gameweek points
        </p>
      </div>

      <form onSubmit={onCheck} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              FPL Team ID <span className="text-red-400">*</span>
            </label>
            <input
              className="input"
              value={entryId}
              onChange={(e) => {
                setEntryId(e.target.value);
                if (error) clearResults();
              }}
              placeholder="e.g., 1234567"
              required
            />
          </div>
          <div>
            <label className="label">Gameweek (optional)</label>
            <input
              className="input"
              value={gw}
              onChange={(e) => {
                setGw(e.target.value);
                if (error) clearResults();
              }}
              placeholder="Leave blank for current"
              type="number"
              min="1"
              max="38"
            />
          </div>
        </div>

        <button
          className="btn btn-primary w-full sm:w-auto"
          disabled={loading || !entryId.trim()}
        >
          {loading ? (
            <>
              <span className="spinner mr-2" />
              Checking...
            </>
          ) : (
            <>🎯 Check My Score</>
          )}
        </button>
      </form>

      {/* Results */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {data && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-green-400 text-sm font-medium">
              <span>✅</span>
              <span>Score Retrieved Successfully</span>
            </div>

            <div className="space-y-2">
              <p className="text-neutral-300">
                <span className="text-sm">Gameweek:</span>{" "}
                <span className="font-semibold text-lg">{data.eventId}</span>
              </p>
              <p className="text-white">
                <span className="text-sm text-neutral-300">Your points:</span>{" "}
                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  {data.points}
                </span>
              </p>
            </div>

            {data.points === 0 && (
              <p className="text-xs text-neutral-400 mt-2">
                No points yet? The gameweek might not have started or finished
                processing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <details className="text-sm text-neutral-400">
        <summary className="cursor-pointer hover:text-neutral-200 transition-colors">
          💡 How to find your FPL Team ID
        </summary>
        <div className="mt-3 p-4 bg-neutral-800/50 rounded-lg space-y-2">
          <ol className="list-decimal ml-4 space-y-1">
            <li>
              Log in at{" "}
              <a
                href="https://fantasy.premierleague.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                fantasy.premierleague.com
              </a>
            </li>
            <li>
              Go to <em className="text-neutral-300">Pick Team</em> → click{" "}
              <em className="text-neutral-300">Gameweek History</em>
            </li>
            <li>Your Team ID is the number in the URL</li>
          </ol>
          <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20 text-xs">
            <strong className="text-blue-300">Example URL:</strong>
            <br />
            <code className="text-blue-400">
              fantasy.premierleague.com/entry/1234567/history
            </code>
            <br />
            <strong className="text-blue-300">Your Team ID:</strong>{" "}
            <code className="text-green-400">1234567</code>
          </div>
        </div>
      </details>
    </div>
  );
}
