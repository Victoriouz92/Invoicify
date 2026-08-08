/**
 * localStorage Helpers for Invoicify.
 *
 * WHAT IT IS: Safe wrappers around localStorage read/write operations.
 * WHY IT EXISTS: localStorage can throw errors (quota exceeded, disabled in private browsing,
 * etc.). These helpers handle errors gracefully so the app never crashes.
 * REAL WORLD ANALOGY: Like a filing cabinet with a lock — if the lock jams,
 * you still have the document in your hand, you just can't file it away.
 */

/**
 * Safely reads and parses JSON from localStorage.
 * Returns the parsed value, or the fallback if anything goes wrong.
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely writes a JSON value to localStorage.
 * Returns true on success, false if the write failed (quota, disabled, etc.).
 */
export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely removes an item from localStorage.
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently ignore — nothing we can do
  }
}

/**
 * Checks if localStorage is available and writable.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__invoicify_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
