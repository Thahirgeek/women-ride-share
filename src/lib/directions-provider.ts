import "server-only";

const MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox/driving";
const MAPBOX_REQUEST_TIMEOUT_MS = 6000;
const DIRECTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export interface DirectionsCoordinate {
  lat: number;
  lng: number;
}

export interface DirectionsRouteResult {
  points: DirectionsCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
}

interface MapboxDirectionsRoute {
  distance?: number;
  duration?: number;
  geometry?: {
    coordinates?: Array<[number, number]>;
  };
}

interface MapboxDirectionsResponse {
  routes?: MapboxDirectionsRoute[];
}

export class DirectionsProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DirectionsProviderError";
    this.status = status;
  }
}

const globalForDirectionsProvider = globalThis as unknown as {
  directionsCache?: Map<string, { expiresAt: number; value: DirectionsRouteResult }>;
};

const directionsCache =
  globalForDirectionsProvider.directionsCache ??
  new Map<string, { expiresAt: number; value: DirectionsRouteResult }>();

if (process.env.NODE_ENV !== "production") {
  globalForDirectionsProvider.directionsCache = directionsCache;
}

function getMapboxToken() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new DirectionsProviderError(
      "Route service is not configured. Missing MAPBOX_ACCESS_TOKEN.",
      503
    );
  }

  return token;
}

function toCacheKey(coordinates: DirectionsCoordinate[]) {
  return coordinates
    .map(({ lat, lng }) => `${lat.toFixed(6)},${lng.toFixed(6)}`)
    .join("|");
}

function getCachedRoute(cacheKey: string) {
  const cached = directionsCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    directionsCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function setCachedRoute(cacheKey: string, value: DirectionsRouteResult) {
  directionsCache.set(cacheKey, {
    expiresAt: Date.now() + DIRECTIONS_CACHE_TTL_MS,
    value,
  });
}

export async function getDrivingRoute(
  coordinates: DirectionsCoordinate[]
): Promise<DirectionsRouteResult> {
  if (coordinates.length < 2) {
    throw new DirectionsProviderError(
      "At least two coordinates are required to calculate a route.",
      400
    );
  }

  const token = getMapboxToken();
  const cacheKey = toCacheKey(coordinates);
  const cached = getCachedRoute(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAPBOX_REQUEST_TIMEOUT_MS);

  try {
    const coordinatePath = coordinates
      .map(({ lat, lng }) => `${lng},${lat}`)
      .join(";");

    const url =
      `${MAPBOX_DIRECTIONS_URL}/${coordinatePath}` +
      `?alternatives=false` +
      `&geometries=geojson` +
      `&overview=full` +
      `&steps=false` +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new DirectionsProviderError(
        "Route service authentication failed. Check MAPBOX_ACCESS_TOKEN.",
        503
      );
    }

    if (response.status === 429) {
      throw new DirectionsProviderError(
        "Route service rate limit reached. Please retry shortly.",
        429
      );
    }

    if (!response.ok) {
      throw new DirectionsProviderError(
        "Route service is temporarily unavailable.",
        502
      );
    }

    const payload = (await response.json()) as MapboxDirectionsResponse;
    const route = payload.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      throw new DirectionsProviderError(
        "No drivable route found for the selected points.",
        422
      );
    }

    const points = route.geometry.coordinates
      .map(([lng, lat]) => ({ lat, lng }))
      .filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng));

    if (points.length < 2) {
      throw new DirectionsProviderError(
        "Route data was returned in an unexpected format.",
        502
      );
    }

    const result: DirectionsRouteResult = {
      points,
      distanceMeters: route.distance ?? 0,
      durationSeconds: route.duration ?? 0,
    };

    setCachedRoute(cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof DirectionsProviderError) throw error;

    if ((error as Error).name === "AbortError") {
      throw new DirectionsProviderError(
        "Route service timed out. Please try again.",
        504
      );
    }

    throw new DirectionsProviderError(
      "Unable to calculate route right now.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}