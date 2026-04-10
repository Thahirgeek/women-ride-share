import { auth } from "@/lib/auth";
import {
  getLocationSuggestions,
  LocationProviderError,
} from "@/lib/location-provider";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const MIN_QUERY_LENGTH = 3;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 8;
const CACHE_TTL_MS = 3 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  suggestions: Awaited<ReturnType<typeof getLocationSuggestions>>;
};

const suggestionCache = new Map<string, CacheEntry>();

export const dynamic = "force-dynamic";

function parseLimit(rawLimit: string | null) {
  if (!rawLimit) return DEFAULT_LIMIT;

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;

  return Math.min(parsed, MAX_LIMIT);
}

function cacheKey(query: string, limit: number) {
  return `${query.toLowerCase()}::${limit}`;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json({ suggestions: [] });
  }

  const key = cacheKey(query, limit);
  const now = Date.now();
  const cached = suggestionCache.get(key);

  if (cached && cached.expiresAt > now) {
    return Response.json({ suggestions: cached.suggestions });
  }

  try {
    const suggestions = await getLocationSuggestions(query, limit);
    suggestionCache.set(key, {
      suggestions,
      expiresAt: now + CACHE_TTL_MS,
    });

    return Response.json(
      { suggestions },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof LocationProviderError) {
      return Response.json({ error: error.message, suggestions: [] }, { status: error.status });
    }

    return Response.json(
      {
        error: "Location suggestions are unavailable right now.",
        suggestions: [],
      },
      { status: 500 }
    );
  }
}
