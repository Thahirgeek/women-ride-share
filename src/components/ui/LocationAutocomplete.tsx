"use client";

import { cn } from "@/lib/utils";
import { LocationSuggestion } from "@/lib/location-types";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

interface LocationAutocompleteProps {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  selectedLocation: LocationSuggestion | null;
  onSelectedLocationChange: (location: LocationSuggestion | null) => void;
  error?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  minQueryLength?: number;
}

export default function LocationAutocomplete({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  selectedLocation,
  onSelectedLocationChange,
  error,
  className,
  required,
  disabled,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [requestError, setRequestError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedValue = value.trim();
  const canSearch = normalizedValue.length >= minQueryLength;

  const listboxId = useMemo(() => `${id}-listbox`, [id]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!canSearch || !isOpen || disabled) {
      setSuggestions([]);
      setIsLoading(false);
      setRequestError("");
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setRequestError("");

      try {
        const params = new URLSearchParams({
          q: normalizedValue,
        });

        const response = await fetch(`/api/locations/suggest?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          suggestions?: LocationSuggestion[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load location suggestions.");
        }

        setSuggestions(payload.suggestions ?? []);
        setHighlightedIndex(payload.suggestions?.length ? 0 : -1);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setSuggestions([]);
        setHighlightedIndex(-1);
        setRequestError((error as Error).message || "Unable to load location suggestions.");
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [canSearch, disabled, isOpen, normalizedValue]);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    onValueChange(suggestion.label);
    onSelectedLocationChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setRequestError("");
  };

  const handleInputChange = (nextValue: string) => {
    onValueChange(nextValue);

    if (selectedLocation && nextValue.trim() !== selectedLocation.label) {
      onSelectedLocationChange(null);
    }

    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!suggestions.length) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && canSearch && !disabled;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-(--text-2)">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
          }
          className={cn(
            "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-(--text-3) outline-none transition-all duration-200 focus:border-(--primary)/55 focus:ring-2 focus:ring-(--primary)/15 disabled:bg-(--bg-muted) disabled:text-(--text-3)",
            error
              ? "border-(--danger)/45 focus:border-(--danger) focus:ring-(--danger)/20"
              : ""
          )}
        />

        {showDropdown && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-white p-1 shadow-lg"
          >
            {isLoading && (
              <p className="px-2 py-2 text-xs text-(--text-2)">
                Searching locations...
              </p>
            )}

            {!isLoading && requestError && (
              <p className="px-2 py-2 text-xs text-(--danger)">{requestError}</p>
            )}

            {!isLoading && !requestError && !suggestions.length && (
              <p className="px-2 py-2 text-xs text-(--text-2)">
                No matching locations found.
              </p>
            )}

            {!isLoading &&
              !requestError &&
              suggestions.map((suggestion, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={suggestion.placeId}
                    id={`${id}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full rounded-md px-2 py-2 text-left text-sm transition-colors",
                      isHighlighted
                        ? "bg-(--bg-muted) text-foreground"
                        : "text-(--text-2) hover:bg-(--bg-muted)"
                    )}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {suggestion.label}
                    </span>
                    {(suggestion.city || suggestion.region || suggestion.country) && (
                      <span className="block text-xs text-(--text-3)">
                        {[suggestion.city, suggestion.region, suggestion.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {!canSearch && normalizedValue.length > 0 && (
        <p className="text-xs text-(--text-3)">
          Type at least {minQueryLength} characters to see suggestions.
        </p>
      )}
      {canSearch && normalizedValue.length > 0 && !selectedLocation && !error && (
        <p className="text-xs text-(--text-3)">Select a location from suggestions.</p>
      )}
      {error && <p className="text-xs text-(--danger)">{error}</p>}
    </div>
  );
}
