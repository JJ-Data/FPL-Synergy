import ScoreCard from "@/components/ScoreCard";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">FPL 2025/26 Company Challenge</h1>
      <p className="text-neutral-300">
        Enter your FPL Team ID to see your current Gameweek points. This tool
        uses public FPL endpoints and only works server-side.
      </p>
      <ScoreCard />
    </div>
  );
}
