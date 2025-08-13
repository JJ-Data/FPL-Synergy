export type Event = {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
};

export async function getBootstrap() {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Failed to fetch bootstrap-static");
  return res.json() as Promise<{ events: Event[] }>;
}

export async function getCurrentEventId() {
  const data = await getBootstrap();
  const current =
    data.events.find((e) => e.is_current) ??
    data.events.find((e) => e.is_next) ??
    data.events[0];
  return current?.id ?? 1;
}

export async function getEntryHistory(entryId: number) {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${entryId}/history/`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch entry history");
  return res.json() as Promise<{
    current: { event: number; points: number; total_points: number }[];
  }>;
}

export async function getWeeklyPoints(entryId: number, gw?: number) {
  const eventId = gw ?? (await getCurrentEventId());
  const history = await getEntryHistory(entryId);
  const row = history.current.find((r) => r.event === eventId);
  return { eventId, points: row?.points ?? 0 };
}
