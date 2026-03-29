export const localCache = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  clearAll(): void {
    const keys = Object.values(CACHE_KEYS);
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  },
};

export const CACHE_KEYS = {
  tasks: "sha_tasks",
  entries: "sha_entries",
  notes: "sha_notes",
  folders: "sha_folders",
  outfits: "sha_outfits",
  clothing: "sha_clothing",
  plannerOutfits: "sha_planner_outfits",
  profile: "sha_profile",
};
