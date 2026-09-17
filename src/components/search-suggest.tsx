"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { VerifiedBadge } from "@/components/agency-card";
import type { SearchSuggestions } from "@/types/api";

export type SuggestionGroup = keyof SearchSuggestions;

/** One suggestion with the group it came from. */
export type Suggestion = { [G in SuggestionGroup]: SearchSuggestions[G][number] & { kind: G } }[SuggestionGroup];

const GROUPS: { key: SuggestionGroup; label: string }[] = [
  { key: "societies", label: "Societies" },
  { key: "phases", label: "Phases" },
  { key: "projects", label: "Projects" },
  { key: "agencies", label: "Agencies" },
];

const ALL_GROUPS = GROUPS.map((group) => group.key);

/** The API rejects shorter terms. */
const MIN_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Where a suggestion leads: societies and phases open a property search (keeping `params`, e.g. purpose and price), projects and agencies their own page.
 * A society replaces the keyword; a phase searches its name inside its society.
 */
export function suggestionHref(suggestion: Suggestion, params?: URLSearchParams): string {
  const query = new URLSearchParams(params);
  query.delete("page");

  switch (suggestion.kind) {
    case "societies":
      query.delete("q");
      query.set("city_id", String(suggestion.city_id));
      query.set("society_id", String(suggestion.id));

      return `/properties?${query.toString()}`;
    case "phases":
      if (suggestion.city_id) {
        query.set("city_id", String(suggestion.city_id));
      } else {
        query.delete("city_id");
      }

      query.set("society_id", String(suggestion.society_id));
      query.set("q", suggestion.name);

      return `/properties?${query.toString()}`;
    case "projects":
      return `/projects/${encodeURIComponent(suggestion.slug)}`;
    case "agencies":
      return `/agencies/${encodeURIComponent(suggestion.slug)}`;
  }
}

function detailOf(suggestion: Suggestion): string | null {
  switch (suggestion.kind) {
    case "societies":
    case "agencies":
      return suggestion.city;
    case "phases":
      return suggestion.society;
    case "projects":
      return [suggestion.developer_name, suggestion.city].filter(Boolean).join(" · ") || null;
  }
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "onKeyDown" | "onFocus" | "onBlur" | "onSelect"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Groups to offer, in display order of GROUPS. */
  groups?: SuggestionGroup[];
  /** Where a picked suggestion navigates; defaults to suggestionHref. */
  hrefFor?: (suggestion: Suggestion) => string;
  /** Class of the wrapper that holds the icon, the input and the dropdown. */
  className?: string;
  icon?: ReactNode;
};

/**
 * A search input with grouped keyword suggestions (societies, phases, projects, agencies) as an ARIA combobox.
 * Enter without a highlighted suggestion submits the surrounding form as before; a failed lookup simply shows no dropdown.
 * Controlled with value/onValueChange, or uncontrolled with defaultValue and name for plain GET forms.
 */
export function SearchSuggest({ value, defaultValue = "", onValueChange, groups = ALL_GROUPS, hrefFor = suggestionHref, className, icon, ...inputProps }: Props) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const term = (value ?? innerValue).trim().slice(0, 100);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [term]);

  // A changed term leaves the previous query without observers, so TanStack Query aborts its request through `signal`.
  const { data, isError } = useQuery({
    queryKey: ["search-suggestions", debounced],
    enabled: debounced.length >= MIN_LENGTH,
    staleTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }): Promise<SearchSuggestions> => {
      const response = await fetch(`/api/search/suggestions?${new URLSearchParams({ q: debounced }).toString()}`, { signal });

      if (!response.ok) {
        throw new Error("Could not load suggestions.");
      }

      return ((await response.json()) as { data: SearchSuggestions }).data;
    },
  });

  const sections =
    data && !isError && term.length >= MIN_LENGTH
      ? GROUPS.filter((group) => groups.includes(group.key))
          .map((group) => ({ ...group, items: (data[group.key] ?? []).map((item) => ({ ...item, kind: group.key }) as Suggestion) }))
          .filter((section) => section.items.length > 0)
      : [];
  const items = sections.flatMap((section) => section.items);
  const expanded = open && items.length > 0;
  const activeIndex = expanded && active < items.length ? active : -1;
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, id]);

  function change(next: string) {
    setInnerValue(next);
    onValueChange?.(next);
    setOpen(true);
    setActive(-1);
  }

  function select(suggestion: Suggestion) {
    setOpen(false);
    setActive(-1);
    router.push(hrefFor(suggestion));
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) {
        return;
      }

      event.preventDefault();
      setOpen(true);
      // Positions 0..n-1 are suggestions and n is the typed text, so arrows cycle through the list and back to the input.
      const count = items.length + 1;
      const position = activeIndex === -1 ? items.length : activeIndex;
      const next = (position + (event.key === "ArrowDown" ? 1 : -1) + count) % count;
      setActive(next === items.length ? -1 : next);

      return;
    }

    if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        select(items[activeIndex]);
      } else {
        setOpen(false);
      }

      return;
    }

    if (event.key === "Escape" && expanded) {
      // Keep the typed text; browsers clear type="search" inputs on Escape.
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className={`search-suggest${className ? ` ${className}` : ""}`}>
      {icon}
      <input
        {...inputProps}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={value ?? innerValue}
        onChange={(event) => change(event.target.value)}
        onKeyDown={keyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {/* mousedown would blur the input and close the list before the click lands */}
      <div id={listId} role="listbox" aria-label="Search suggestions" className="search-suggest-list" hidden={!expanded} onMouseDown={(event) => event.preventDefault()}>
        {sections.map((section) => (
          <div key={section.key} role="group" aria-labelledby={`${id}-${section.key}`}>
            <div id={`${id}-${section.key}`} className="search-suggest-group">
              {section.label}
            </div>
            {section.items.map((item) => {
              const index = items.indexOf(item);
              const detail = detailOf(item);

              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className="search-suggest-option"
                  onMouseMove={() => setActive(index)}
                  onClick={() => select(item)}
                >
                  <span className="search-suggest-name">{item.name}</span>
                  {(detail || (item.kind === "agencies" && item.is_verified)) && (
                    <span className="search-suggest-detail">
                      {detail}
                      {item.kind === "agencies" && item.is_verified && <VerifiedBadge />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
