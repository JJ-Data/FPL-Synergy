import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-800">
          <nav className="container flex items-center gap-4 py-4">
            <Link href="/" className="font-semibold">
              FPL Company Challenge
            </Link>
            <div className="ml-auto flex gap-3">
              <Link className="btn" href="/leaderboard">
                Leaderboard
              </Link>
              <Link className="btn" href="/monthly">
                Monthly
              </Link>
              <Link className="btn" href="/admin">
                Admin
              </Link>
              <Link className="btn" href="/register">
                Register
              </Link>
            </div>
          </nav>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-10 text-xs text-neutral-400">
          Unofficial FPL companion. Data from public FPL endpoints (server-side
          only).
        </footer>
      </body>
    </html>
  );
}
