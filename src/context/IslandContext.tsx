import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  RELATIONSHIP_STAGE_CONFIG,
  getStageDefinition,
} from "@/config/relationshipStages";
import {
  addMiiToIsland,
  addRelationshipPairToIsland,
  deleteMiiFromIsland,
  deleteRelationshipPairFromIsland,
  updateMiiInIsland,
  updateRelationshipPairInIsland,
} from "@/lib/islandMutations";
import { createEmptyIslandData } from "@/lib/island";
import { localStorageAdapter, type StorageAdapter } from "@/services/storageAdapter";
import type {
  IslandData,
  MiiInput,
  RelationshipPairInput,
} from "@/types/domain";

interface IslandContextValue {
  status: "loading" | "ready" | "error";
  errorMessage?: string;
  islandData: IslandData;
  adapterLabel: string;
  addMii(input: MiiInput): Promise<void>;
  updateMii(miiId: string, input: MiiInput): Promise<void>;
  deleteMii(miiId: string): Promise<void>;
  addRelationshipPair(input: RelationshipPairInput): Promise<void>;
  updateRelationshipPair(
    relationshipId: string,
    input: RelationshipPairInput,
  ): Promise<void>;
  deleteRelationshipPair(relationshipId: string): Promise<void>;
  getStageDefinition(stageKey: string): ReturnType<typeof getStageDefinition>;
  relationshipConfig: typeof RELATIONSHIP_STAGE_CONFIG;
}

const IslandContext = createContext<IslandContextValue | undefined>(undefined);

async function persistUpdate(
  adapter: StorageAdapter,
  currentData: IslandData,
  setIslandData: React.Dispatch<React.SetStateAction<IslandData>>,
  update: (data: IslandData) => IslandData,
) {
  const nextSnapshot = update(currentData);

  startTransition(() => {
    setIslandData(nextSnapshot);
  });

  await adapter.saveIsland(nextSnapshot);
}

export function IslandProvider({
  children,
  adapter = localStorageAdapter,
}: PropsWithChildren<{ adapter?: StorageAdapter }>) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [islandData, setIslandData] = useState<IslandData>(createEmptyIslandData());
  const islandDataRef = useRef(islandData);

  useEffect(() => {
    islandDataRef.current = islandData;
  }, [islandData]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    adapter
      .loadIsland()
      .then((loadedIsland) => {
        if (!isMounted) {
          return;
        }

        setIslandData(loadedIsland);
        setStatus("ready");

        if (adapter.subscribe) {
          unsubscribe = adapter.subscribe((nextData) => {
            setIslandData(nextData);
          });
        }
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message);
        setStatus("error");
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [adapter]);

  const addMii = useCallback(
    async (input: MiiInput) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        addMiiToIsland(data, input),
      );
    },
    [adapter],
  );

  const updateMii = useCallback(
    async (miiId: string, input: MiiInput) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        updateMiiInIsland(data, miiId, input),
      );
    },
    [adapter],
  );

  const deleteMii = useCallback(
    async (miiId: string) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        deleteMiiFromIsland(data, miiId),
      );
    },
    [adapter],
  );

  const addRelationshipPair = useCallback(
    async (input: RelationshipPairInput) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        addRelationshipPairToIsland(data, input),
      );
    },
    [adapter],
  );

  const updateRelationshipPair = useCallback(
    async (relationshipId: string, input: RelationshipPairInput) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        updateRelationshipPairInIsland(data, relationshipId, input),
      );
    },
    [adapter],
  );

  const deleteRelationshipPair = useCallback(
    async (relationshipId: string) => {
      await persistUpdate(adapter, islandDataRef.current, setIslandData, (data) =>
        deleteRelationshipPairFromIsland(data, relationshipId),
      );
    },
    [adapter],
  );

  const value: IslandContextValue = useMemo(
    () => ({
      status,
      errorMessage,
      islandData,
      adapterLabel: "Local storage adapter",
      addMii,
      updateMii,
      deleteMii,
      addRelationshipPair,
      updateRelationshipPair,
      deleteRelationshipPair,
      getStageDefinition,
      relationshipConfig: RELATIONSHIP_STAGE_CONFIG,
    }),
    [
      addMii,
      addRelationshipPair,
      deleteMii,
      deleteRelationshipPair,
      errorMessage,
      islandData,
      status,
      updateMii,
      updateRelationshipPair,
    ],
  );

  return <IslandContext.Provider value={value}>{children}</IslandContext.Provider>;
}

export function useIslandContext() {
  const context = useContext(IslandContext);

  if (!context) {
    throw new Error("useIslandContext must be used inside IslandProvider.");
  }

  return context;
}
