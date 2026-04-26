import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";

describe("relationship stage config", () => {
  it("parses the CSV into typed stages grouped by relationship type", () => {
    expect(RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends).toHaveLength(7);
    expect(RELATIONSHIP_STAGE_CONFIG.stagesByType.Strangers).toHaveLength(1);
  });

  it("generates stable stage keys by row order within each type", () => {
    expect(RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey).toBe("friends:0");
    expect(RELATIONSHIP_STAGE_CONFIG.stagesByType["One-sided love (friend)"][6].stageKey).toBe(
      "one-sided-love-friend:6",
    );
  });

  it("keeps optional meter fields undefined when the CSV does not provide them", () => {
    const strangerStage = RELATIONSHIP_STAGE_CONFIG.stagesByType.Strangers[0];

    expect(strangerStage.label).toBe("No connection");
    expect(strangerStage.meterMin).toBeUndefined();
    expect(strangerStage.meterMax).toBeUndefined();
  });
});
