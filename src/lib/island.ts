import { islandDataSchema } from "@/lib/schemas";
import type { IslandData } from "@/types/domain";

export const SCHEMA_VERSION = 1;

export function createEmptyIslandData(): IslandData {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    miis: [],
    relationships: [],
  };
}

export function normalizeIslandData(data: unknown): IslandData {
  const parsed = islandDataSchema.safeParse(data);

  if (!parsed.success) {
    return createEmptyIslandData();
  }

  return parsed.data;
}
