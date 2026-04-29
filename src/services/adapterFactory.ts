import { createSupabaseStorageAdapter } from "@/services/supabaseAdapter";
import { localStorageAdapter, type StorageAdapter } from "@/services/storageAdapter";

export function createDefaultStorageAdapter(): StorageAdapter {
  return createSupabaseStorageAdapter() ?? localStorageAdapter;
}
