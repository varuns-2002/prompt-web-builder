import type { FeedbackEvent } from "./types";

/**
 * Persistence boundary for feedback. The MVP stores events in the browser;
 * a later backend can implement the same interface and feed model training.
 */
export interface FeedbackStore {
  record(event: Omit<FeedbackEvent, "id" | "createdAt">): FeedbackEvent;
  list(): FeedbackEvent[];
  clear(): void;
  subscribe(listener: () => void): () => void;
  /** Stable primitive suitable for useSyncExternalStore. */
  count(): number;
}

const STORAGE_KEY = "prompt-web-builder:feedback:v1";
const MAX_EVENTS = 1000;

function isEvent(value: unknown): value is FeedbackEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<FeedbackEvent>;
  return (
    typeof e.id === "string" &&
    typeof e.action === "string" &&
    typeof e.siteType === "string" &&
    typeof e.features === "object" &&
    e.features !== null
  );
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function feedbackPromptKey(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 500).toLowerCase();
}

let sessionId: string | null = null;

/** Tab-scoped identity survives refreshes, but not a new independent tab session. */
export function getFeedbackSessionId(): string {
  if (sessionId) return sessionId;
  const key = "prompt-web-builder:feedback-session:v1";
  try {
    sessionId = window.sessionStorage.getItem(key) || newId();
    window.sessionStorage.setItem(key, sessionId);
  } catch (error) {
    console.warn("Feedback session storage is unavailable; rating deduplication will last until this page is refreshed.", error);
    sessionId = newId();
  }
  return sessionId;
}

export function findPromptRating(events: FeedbackEvent[], session: string, prompt: string): FeedbackEvent | undefined {
  const key = feedbackPromptKey(prompt);
  return events.find((event) => event.action === "rate" && event.sessionId === session && event.promptKey === key);
}

export class LocalFeedbackStore implements FeedbackStore {
  private listeners = new Set<() => void>();
  private cache: FeedbackEvent[] | null = null;

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null) {}

  list(): FeedbackEvent[] {
    if (this.cache) return this.cache;
    let events: FeedbackEvent[] = [];
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) events = parsed.filter(isEvent);
    } catch {
      events = [];
    }
    this.cache = events;
    return events;
  }

  record(event: Omit<FeedbackEvent, "id" | "createdAt">): FeedbackEvent {
    const events = this.list();
    const scope = event.action === "rate" && event.sessionId && event.promptKey
      ? { sessionId: event.sessionId, promptKey: feedbackPromptKey(event.promptKey) }
      : null;
    const previous = scope ? findPromptRating(events, scope.sessionId, scope.promptKey) : undefined;
    const full: FeedbackEvent = {
      ...event,
      ...scope,
      id: previous?.id ?? newId(),
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    };
    const remaining = scope
      ? events.filter((item) => !(item.action === "rate" && item.sessionId === full.sessionId && item.promptKey === full.promptKey))
      : events;
    this.write([...remaining, full].slice(-MAX_EVENTS));
    return full;
  }

  clear(): void {
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode); in-memory state still resets.
    }
    this.cache = [];
    this.emit();
  }

  count(): number {
    return this.list().length;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private write(events: FeedbackEvent[]): void {
    this.cache = events;
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Quota or privacy errors must never break the builder.
    }
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}

let browserStore: FeedbackStore | null = null;

/** Shared store backed by localStorage; falls back to memory when unavailable. */
export function getBrowserFeedbackStore(): FeedbackStore {
  if (!browserStore) {
    let storage: Storage | null = null;
    try {
      storage = typeof window === "undefined" ? null : window.localStorage;
    } catch {
      storage = null;
    }
    browserStore = new LocalFeedbackStore(storage);
  }
  return browserStore;
}
