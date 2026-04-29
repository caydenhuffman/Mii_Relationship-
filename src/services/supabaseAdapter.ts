import { createEmptyIslandData, normalizeIslandData } from "@/lib/island";
import { supabase } from "@/services/supabaseClient";
import type { StorageAdapter } from "@/services/storageAdapter";
import type { IslandData } from "@/types/domain";

const DEFAULT_ISLAND_KEY = "shared-island";
const TABLE_NAME = "island_snapshots";

interface IslandSnapshotRow {
  island_key: string;
  data: IslandData;
  updated_at: string;
}

interface SupabaseAdapterOptions {
  islandKey?: string;
}

function toSnapshotRow(data: IslandData, islandKey: string): IslandSnapshotRow {
  return {
    island_key: islandKey,
    data,
    updated_at: new Date().toISOString(),
  };
}

export function createSupabaseStorageAdapter(
  options: SupabaseAdapterOptions = {},
): StorageAdapter | null {
  if (!supabase) {
    return null;
  }

  const client = supabase;
  const islandKey =
    options.islandKey ??
    import.meta.env.VITE_SUPABASE_ISLAND_KEY ??
    DEFAULT_ISLAND_KEY;

  return {
    label: `Supabase (${islandKey})`,
    async loadIsland() {
      const { data, error } = await client
        .from(TABLE_NAME)
        .select("data")
        .eq("island_key", islandKey)
        .maybeSingle<{ data: IslandData }>();

      if (error) {
        throw new Error(`Unable to load island from Supabase: ${error.message}`);
      }

      if (!data?.data) {
        return createEmptyIslandData();
      }

      return normalizeIslandData(data.data);
    },
    async saveIsland(data) {
      const row = toSnapshotRow(data, islandKey);
      const { error } = await client.from(TABLE_NAME).upsert(row, {
        onConflict: "island_key",
      });

      if (error) {
        throw new Error(`Unable to save island to Supabase: ${error.message}`);
      }
    },
    subscribe(listener) {
      const channel = client
        .channel(`island-snapshots:${islandKey}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: TABLE_NAME,
            filter: `island_key=eq.${islandKey}`,
          },
          (payload) => {
            const nextRow = payload.new as Partial<IslandSnapshotRow> | undefined;

            if (!nextRow?.data) {
              return;
            }

            listener(normalizeIslandData(nextRow.data));
          },
        )
        .subscribe();

      return () => {
        void client.removeChannel(channel);
      };
    },
  };
}
