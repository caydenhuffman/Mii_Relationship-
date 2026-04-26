import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";
import { SCHEMA_VERSION } from "@/lib/island";
import type { IslandData, Mii, Relationship, RelationshipType } from "@/types/domain";

const createdAt = "2026-04-26T18:00:00.000Z";
const updatedAt = "2026-04-26T18:00:00.000Z";

function stageKey(relationshipType: RelationshipType, index: number) {
  return RELATIONSHIP_STAGE_CONFIG.stagesByType[relationshipType][index].stageKey;
}

export const fixtureMiis: Mii[] = [
  {
    id: "mii-alice",
    name: "Alice",
    personalityType: "Cheerleader",
    level: 18,
    createdAt,
    updatedAt,
  },
  {
    id: "mii-bob",
    name: "Bob",
    personalityType: "Strategist",
    level: 22,
    createdAt,
    updatedAt,
  },
  {
    id: "mii-carol",
    name: "Carol",
    personalityType: "Sweetie",
    level: 27,
    createdAt,
    updatedAt,
  },
  {
    id: "mii-daisy",
    name: "Daisy",
    personalityType: "Go-Getter",
    level: 11,
    createdAt,
    updatedAt,
  },
  {
    id: "mii-evan",
    name: "Evan",
    personalityType: "Observer",
    level: 14,
    createdAt,
    updatedAt,
  },
  {
    id: "mii-frank",
    name: "Frank",
    personalityType: "Thinker",
    level: 9,
    createdAt,
    updatedAt,
  },
];

export const fixtureRelationships: Relationship[] = [
  {
    id: "rel-alice-bob",
    pairId: "pair-alice-bob",
    sourceMiiId: "mii-alice",
    targetMiiId: "mii-bob",
    relationshipType: "Friends",
    stageKey: stageKey("Friends", 4),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-bob-alice",
    pairId: "pair-alice-bob",
    sourceMiiId: "mii-bob",
    targetMiiId: "mii-alice",
    relationshipType: "Friends",
    stageKey: stageKey("Friends", 5),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-alice-carol",
    pairId: "pair-alice-carol",
    sourceMiiId: "mii-alice",
    targetMiiId: "mii-carol",
    relationshipType: "Sweethearts",
    stageKey: stageKey("Sweethearts", 3),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-carol-alice",
    pairId: "pair-alice-carol",
    sourceMiiId: "mii-carol",
    targetMiiId: "mii-alice",
    relationshipType: "Sweethearts",
    stageKey: stageKey("Sweethearts", 4),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-daisy-alice",
    sourceMiiId: "mii-daisy",
    targetMiiId: "mii-alice",
    relationshipType: "Acquaintances",
    stageKey: stageKey("Acquaintances", 3),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-alice-evan",
    pairId: "pair-alice-evan",
    sourceMiiId: "mii-alice",
    targetMiiId: "mii-evan",
    relationshipType: "Friends",
    stageKey: stageKey("Friends", 3),
    createdAt,
    updatedAt,
  },
  {
    id: "rel-evan-alice",
    pairId: "pair-alice-evan",
    sourceMiiId: "mii-evan",
    targetMiiId: "mii-alice",
    relationshipType: "Family",
    stageKey: stageKey("Family", 4),
    createdAt,
    updatedAt,
  },
];

export const sampleIslandData: IslandData = {
  schemaVersion: SCHEMA_VERSION,
  updatedAt,
  miis: fixtureMiis,
  relationships: fixtureRelationships,
};
