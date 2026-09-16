"use client";

import { useSyncExternalStore } from "react";

const EMPTY: number[] = [];

export type IdStore = {
  /** The stored ids (newest first); empty on the server and when storage is blocked. */
  useIds: () => number[];
  read: () => number[];
  write: (ids: number[]) => void;
  remove: (id: number) => void;
};

/**
 * A short list of listing ids kept in localStorage and shared by every component on the page (and other tabs).
 * Reads never throw: blocked or corrupt storage behaves like an empty list.
 */
export function createIdStore(key: string, max: number): IdStore {
  const eventName = `id-store:${key}`;
  let cachedRaw: string | null = null;
  let cachedIds: number[] = EMPTY;

  function parse(raw: string | null): number[] {
    if (raw === cachedRaw) {
      return cachedIds;
    }

    let ids: number[] = EMPTY;

    try {
      const value: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(value)) {
        ids = [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))].slice(0, max);
      }
    } catch {
      ids = EMPTY;
    }

    cachedRaw = raw;
    cachedIds = ids;

    return ids;
  }

  function read(): number[] {
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      return EMPTY;
    }
  }

  function write(ids: number[]): void {
    try {
      window.localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(0, max)));
    } catch {
      // Storage is full or blocked; the list simply is not remembered.
    }

    window.dispatchEvent(new Event(eventName));
  }

  function subscribe(onChange: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) {
        onChange();
      }
    };

    window.addEventListener(eventName, onChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(eventName, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    useIds: () => useSyncExternalStore(subscribe, read, () => EMPTY),
    read,
    write,
    remove: (id) => write(read().filter((item) => item !== id)),
  };
}

export const MAX_COMPARE = 3;

/** Listings picked for side-by-side comparison. */
export const compareStore = createIdStore("dha-web-compare", MAX_COMPARE);

/** Listings the visitor opened, newest first. */
export const recentlyViewedStore = createIdStore("dha-web-recently-viewed", 10);
