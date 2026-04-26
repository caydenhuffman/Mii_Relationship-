import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";
import { relationshipPairFormSchema } from "@/lib/schemas";

describe("relationship form validation", () => {
  it("rejects self-referential relationships", () => {
    const result = relationshipPairFormSchema.safeParse({
      sourceMiiId: "mii-1",
      targetMiiId: "mii-1",
      relationshipType: "Friends",
      stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey,
      inverseRelationshipType: "Friends",
      inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[1].stageKey,
    });

    expect(result.success).toBe(false);
  });

  it("rejects stages that do not match the chosen relationship type", () => {
    const result = relationshipPairFormSchema.safeParse({
      sourceMiiId: "mii-1",
      targetMiiId: "mii-2",
      relationshipType: "Friends",
      stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Sweethearts[0].stageKey,
      inverseRelationshipType: "Friends",
      inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey,
    });

    expect(result.success).toBe(false);
  });

  it("rejects inverse stages that do not match the inverse relationship type", () => {
    const result = relationshipPairFormSchema.safeParse({
      sourceMiiId: "mii-1",
      targetMiiId: "mii-2",
      relationshipType: "Friends",
      stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey,
      inverseRelationshipType: "Family",
      inverseStageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey,
    });

    expect(result.success).toBe(false);
  });
});
