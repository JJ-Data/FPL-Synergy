import ScoreCard from "@/components/ScoreCard";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          FPL 2024/25 Company Challenge
        </h1>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
          Compete with your colleagues in the ultimate Fantasy Premier League
          showdown. Track weekly standings, monthly winners, and prove who's the
          true FPL master.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">⚽</div>
          <h3 className="font-semibold mt-2">Weekly Competition</h3>
          <p className="text-sm text-neutral-400">Compete every gameweek</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">🏆</div>
          <h3 className="font-semibold mt-2">Monthly Winners</h3>
          <p className="text-sm text-neutral-400">
            Monthly leaderboards & prizes
          </p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-400">📊</div>
          <h3 className="font-semibold mt-2">Real-time Data</h3>
          <p className="text-sm text-neutral-400">Live FPL API integration</p>
        </div>
      </div>

      {/* Score Check Section */}
      <ScoreCard />

      {/* Call to Action */}
      <div className="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">
            Ready to Join the Competition?
          </h2>
          <p className="text-neutral-300">
            Register your FPL team to start competing with your colleagues. It's
            free and only takes a minute!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn btn-primary">
              Join Competition
            </Link>
            <Link href="/leaderboard" className="btn">
              📈 View Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-medium">Create Your FPL Team</h3>
                <p className="text-sm text-neutral-400">
                  Set up your team on the official Fantasy Premier League
                  website
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-medium">Register Here</h3>
                <p className="text-sm text-neutral-400">
                  Submit your FPL Team ID and wait for admin approval
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-medium">Compete Weekly</h3>
                <p className="text-sm text-neutral-400">
                  Your scores automatically update after each gameweek
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <h3 className="font-medium">Win Monthly Prizes</h3>
                <p className="text-sm text-neutral-400">
                  Top performers each month get bragging rights and more!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Find Your Team ID Help */}
      <details className="card">
        <summary className="cursor-pointer font-medium mb-2 hover:text-blue-400 transition-colors">
          How to find your FPL Team ID
        </summary>
        <div className="pt-2 space-y-2 text-sm text-neutral-400">
          <ol className="list-decimal ml-5 space-y-1">
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
              Go to <em>Pick Team</em> → click <em>Gameweek History</em>
            </li>
            <li>Your Team ID is the number in the URL (e.g., 1234567)</li>
          </ol>
          <p className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <strong>Example:</strong> If your URL is{" "}
            <code className="text-blue-300">
              fantasy.premierleague.com/entry/1234567/history
            </code>
            , then your Team ID is{" "}
            <code className="text-blue-300">1234567</code>
          </p>
        </div>
      </details>

      {/* Footer Info */}
      <div className="text-center text-xs text-neutral-500 border-t border-neutral-800 pt-6">
        <p>
          This is an unofficial tool that uses public FPL API data. Fantasy
          Premier League is a trademark of the Premier League.
        </p>
      </div>
    </div>
  );
}
