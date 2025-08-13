import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "FPL Company Challenge",
  description:
    "Fantasy Premier League competition for your company. Track weekly standings, monthly winners, and compete with colleagues.",
  keywords: "FPL, Fantasy Premier League, company competition, leaderboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-40">
          <nav className="container flex items-center gap-4 py-4">
            <Link
              href="/"
              className="font-bold text-lg hover:text-blue-400 transition-colors"
            >
              ⚽ FPL Challenge
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-auto items-center gap-3">
              <Link
                className="btn hover:btn-primary transition-all"
                href="/leaderboard"
              >
                Leaderboard
              </Link>
              <Link
                className="btn hover:btn-primary transition-all"
                href="/monthly"
              >
                Monthly
              </Link>
              <Link className="btn btn-primary" href="/register">
                Join Now
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden ml-auto">
              <details className="relative">
                <summary className="btn cursor-pointer list-none">
                  <span className="text-lg">☰</span>
                </summary>
                <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl z-50">
                  <div className="p-2 space-y-1">
                    <Link
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                      href="/leaderboard"
                    >
                      Leaderboard
                    </Link>
                    <Link
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                      href="/monthly"
                    >
                      🏆 Monthly
                    </Link>
                    <hr className="border-neutral-700 my-2" />
                    <Link
                      className="block w-full text-left px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                      href="/register"
                    >
                      Join Competition
                    </Link>
                  </div>
                </div>
              </details>
            </div>
          </nav>
        </header>

        <main className="container py-8 min-h-[calc(100vh-200px)]">
          {children}
        </main>

        <footer className="container py-8 border-t border-neutral-800">
          <div className="text-center space-y-4">
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/monthly"
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Monthly
              </Link>
              <Link
                href="/register"
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Register
              </Link>
            </div>

            {/* Footer Info */}
            <div className="text-xs text-neutral-500 space-y-2">
              <p>
                Unofficial FPL companion using public API endpoints (server-side
                only).
              </p>
              <p>
                Fantasy Premier League is a trademark of the Premier League.
              </p>
              <p className="text-neutral-600">
                Made by Jowis for Synergy FPL competitions
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
