import "server-only";

import { LocationSuggestion } from "@/lib/location-types";

const MAPBOX_FORWARD_GEOCODE_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";
const MAPBOX_REQUEST_TIMEOUT_MS = 4000;

export class LocationProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LocationProviderError";
    this.status = status;
  }
}

interface MapboxContextEntry {
  id: string;
  text?: string;
}

interface MapboxFeature {
  id: string;
  place_name?: string;
  center?: [number, number];
  context?: MapboxContextEntry[];
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

function getContextText(context: MapboxContextEntry[] | undefined, prefix: string) {
  return context?.find((entry) => entry.id.startsWith(prefix))?.text ?? null;
}

function getMapboxToken() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new LocationProviderError(
      "Location service is not configured. Missing MAPBOX_ACCESS_TOKEN.",
      503
    );
  }

  return token;
}

export async function getLocationSuggestions(
  query: string,
  limit: number
): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const token = getMapboxToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAPBOX_REQUEST_TIMEOUT_MS);

  try {
    const url =
      `${MAPBOX_FORWARD_GEOCODE_URL}/${encodeURIComponent(trimmedQuery)}.json` +
      `?autocomplete=true` +
      `&limit=${limit}` +
      `&types=place,locality,neighborhood,address,poi` +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new LocationProviderError(
        "Location service authentication failed. Check MAPBOX_ACCESS_TOKEN.",
        503
      );
    }

    if (response.status === 429) {
      throw new LocationProviderError(
        "Location suggestion rate limit reached. Please try again shortly.",
        429
      );
    }

    if (!response.ok) {
      throw new LocationProviderError(
        "Location service is temporarily unavailable.",
        502
      );
    }

    const payload = (await response.json()) as MapboxResponse;
    const features = payload.features ?? [];

    return features
      .filter((feature) => Array.isArray(feature.center) && feature.center.length === 2)
      .map((feature) => {
        const [lng, lat] = feature.center as [number, number];
        return {
          placeId: feature.id,
          label: feature.place_name ?? "",
          lat,
          lng,
          city: getContextText(feature.context, "place"),
          region: getContextText(feature.context, "region"),
          country: getContextText(feature.context, "country"),
        } satisfies LocationSuggestion;
      })
      .filter((suggestion) => suggestion.placeId && suggestion.label);
  } catch (error) {
    if (error instanceof LocationProviderError) throw error;

    if ((error as Error).name === "AbortError") {
      throw new LocationProviderError(
        "Location service timed out. Please try again.",
        504
      );
    }

    throw new LocationProviderError(
      "Unable to fetch location suggestions right now.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}
