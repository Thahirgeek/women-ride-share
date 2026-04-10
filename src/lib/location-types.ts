export interface LocationSuggestion {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
}
