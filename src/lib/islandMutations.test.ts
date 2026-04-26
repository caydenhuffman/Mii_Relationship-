import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";
import {
  addRelationshipPairToIsland,
  deleteMiiFromIsland,
  deleteRelationshipPairFromIsland,
  updateRelationshipPairInIsland,
} from "@/lib/islandMutations";
import { sampleIslandData } from "@/tests/fixtures";

describe("island mutations", () => {
  it("cascades incoming and outgoing relationships when a Mii is deleted", () => {
    const nextIsland = deleteMiiFromIsland(sampleIslandData, "mii-alice");

    expect(nextIsland.miis.map((mii) => mii.id)).not.toContain("mii-alice");
    expect(nextIsland.relationships).toHaveLength(0);
  });

  it("creates both directions when adding a reciprocal relationship", () => {
    const nextIsland = addRelationshipPairToIsland(sampleIslandData, {
      sourceMiiId: "mii-bob",
      targetMiiId: "mii-daisy",
      relationshipType: "Friends",
      stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[4].stageKey,
      inverseRelationshipType: "Family",
      inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Family[3].stageKey,
    });

    const addedRelationships = nextIsland.relationships.filter(
      (relationship) =>
        (relationship.sourceMiiId === "mii-bob" &&
          relationship.targetMiiId === "mii-daisy") ||
        (relationship.sourceMiiId === "mii-daisy" &&
          relationship.targetMiiId === "mii-bob"),
    );

    expect(addedRelationships).toHaveLength(2);
    expect(new Set(addedRelationships.map((relationship) => relationship.pairId)).size).toBe(
      1,
    );
  });

  it("rejects duplicate relationship pairs between the same two Miis", () => {
    expect(() =>
      addRelationshipPairToIsland(sampleIslandData, {
        sourceMiiId: "mii-bob",
        targetMiiId: "mii-alice",
        relationshipType: "Friends",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[4].stageKey,
        inverseRelationshipType: "Friends",
        inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[5].stageKey,
      }),
    ).toThrow(/already have a relationship pair/i);
  });

  it("rejects self relationships", () => {
    expect(() =>
      addRelationshipPairToIsland(sampleIslandData, {
        sourceMiiId: "mii-alice",
        targetMiiId: "mii-alice",
        relationshipType: "Friends",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[4].stageKey,
        inverseRelationshipType: "Friends",
        inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[4].stageKey,
      }),
    ).toThrow(/can't have a relationship with themself/i);
  });

  it("updates both directions when editing a reciprocal relationship", () => {
    const nextIsland = updateRelationshipPairInIsland(sampleIslandData, "rel-alice-bob", {
      sourceMiiId: "mii-alice",
      targetMiiId: "mii-bob",
      relationshipType: "Family",
      stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Family[4].stageKey,
      inverseRelationshipType: "Relatives",
      inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Relatives[5].stageKey,
    });

    expect(
      nextIsland.relationships.find((relationship) => relationship.id === "rel-alice-bob")
        ?.relationshipType,
    ).toBe("Family");
    expect(
      nextIsland.relationships.find((relationship) => relationship.id === "rel-bob-alice")
        ?.relationshipType,
    ).toBe("Relatives");
  });

  it("deletes both directions when deleting a reciprocal relationship", () => {
    const nextIsland = deleteRelationshipPairFromIsland(sampleIslandData, "rel-alice-bob");

    expect(
      nextIsland.relationships.find((relationship) => relationship.id === "rel-alice-bob"),
    ).toBeUndefined();
    expect(
      nextIsland.relationships.find((relationship) => relationship.id === "rel-bob-alice"),
    ).toBeUndefined();
  });
});
