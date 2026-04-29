import { createEmptyIslandData, normalizeIslandData } from "@/lib/island";
import type { IslandData } from "@/types/domain";

export interface StorageAdapter {
  label?: string;
  loadIsland(): Promise<IslandData>;
  saveIsland(data: IslandData): Promise<void>;
  subscribe?(listener: (data: IslandData) => void): () => void;
}

const STORAGE_KEY = "tomodachi-life-relationship-tracker:island";

export const localStorageAdapter: StorageAdapter = {
  label: "Local storage",
  async loadIsland() {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyIslandData();
    }

    try {
      return normalizeIslandData(JSON.parse(raw));
    } catch {
      return createEmptyIslandData();
    }
  },
  async saveIsland(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

export function createMemoryStorageAdapter(
  initialData: IslandData = createEmptyIslandData(),
): StorageAdapter {
  let snapshot = initialData;
  let listeners = new Set<(data: IslandData) => void>();

  return {
    label: "Memory storage",
    async loadIsland() {
      return snapshot;
    },
    async saveIsland(data) {
      snapshot = data;
      listeners.forEach((listener) => listener(snapshot));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
