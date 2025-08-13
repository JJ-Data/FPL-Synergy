export type Event = {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
  deadline_time: string;
};

export type BootstrapData = {
  events: Event[];
};

export type EntryHistoryData = {
  current: { event: number; points: number; total_points: number }[];
};

// In-memory cache with TTL
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Rate limiting for FPL API calls
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60000; // 1 minute

  canMakeRequest(key: string = "default"): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      if (!rateLimiter.canMakeRequest()) {
        throw new Error("Rate limit exceeded for FPL API calls");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "FPL-Company-Challenge/1.0",
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited by FPL API
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}

export async function getBootstrap(): Promise<BootstrapData> {
  const cacheKey = "bootstrap-static";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithRetry(
      "https://fantasy.premierleague.com/api/bootstrap-static/"
    );
    const data = (await res.json()) as BootstrapData;

    // Cache for 5 minutes
    cache.set(cacheKey, data, 300);
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch bootstrap data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getCurrentEventId(): Promise<number> {
  const data = await getBootstrap();
  const current =
    data.events.find((e) => e.is_current) ??
    data.events.find((e) => e.is_next) ??
    data.events[0];

  if (!current) {
    throw new Error("No current gameweek found");
  }

  return current.id;
}

export async function getEntryHistory(
  entryId: number
): Promise<EntryHistoryData> {
  // Validate entry ID
  if (!entryId || entryId < 1 || entryId > 10000000) {
    throw new Error("Invalid entry ID provided");
  }

  const cacheKey = `entry-history-${entryId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithRetry(
      `https://fantasy.premierleague.com/api/entry/${entryId}/history/`
    );
    const data = (await res.json()) as EntryHistoryData;

    // Cache for 2 minutes
    cache.set(cacheKey, data, 120);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP 404")) {
      throw new Error(`FPL team with ID ${entryId} not found`);
    }
    throw new Error(
      `Failed to fetch entry history: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getWeeklyPoints(
  entryId: number,
  gw?: number
): Promise<{ eventId: number; points: number }> {
  try {
    const [eventId, history] = await Promise.all([
      gw ? Promise.resolve(gw) : getCurrentEventId(),
      getEntryHistory(entryId),
    ]);

    const row = history.current.find((r) => r.event === eventId);

    return {
      eventId,
      points: row?.points ?? 0,
    };
  } catch (error) {
    throw new Error(
      `Failed to get weekly points: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function validateEntryExists(entryId: number): Promise<boolean> {
  try {
    await getEntryHistory(entryId);
    return true;
  } catch (error) {
    return false;
  }
}

// Utility function to get gameweeks in a date range
export async function getGameweeksInRange(
  startDate: Date,
  endDate: Date
): Promise<number[]> {
  const bootstrap = await getBootstrap();
  return bootstrap.events
    .filter((event) => {
      const deadline = new Date(event.deadline_time);
      return deadline >= startDate && deadline <= endDate;
    })
    .map((event) => event.id);
}

// Health check function
export async function checkFPLAPIHealth(): Promise<{
  status: "ok" | "error";
  message: string;
}> {
  try {
    await getBootstrap();
    return { status: "ok", message: "FPL API is responsive" };
  } catch (error) {
    return {
      status: "error",
      message: `FPL API health check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
