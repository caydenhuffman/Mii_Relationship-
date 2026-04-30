import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";
import {
  buildDashboardSummary,
  buildMiiRelationshipSummaryMap,
  findFriendGroups,
} from "@/lib/analytics";
import { fixtureMiis, sampleIslandData } from "@/tests/fixtures";
import type { Relationship } from "@/types/domain";

const friendStageKey = RELATIONSHIP_STAGE_CONFIG.stagesByType.Friends[0].stageKey;

describe("analytics helpers", () => {
  it("builds dashboard counts from directed relationships", () => {
    const summary = buildDashboardSummary(
      sampleIslandData.miis,
      sampleIslandData.relationships,
    );

    expect(summary.totalMiis).toBe(6);
    expect(summary.totalRelationships).toBe(7);
    expect(summary.countByType.Friends).toBe(3);
    expect(summary.countByType.Sweethearts).toBe(2);
    expect(summary.countByType.Acquaintances).toBe(1);
    expect(summary.countByType.Family).toBe(1);
    expect(summary.averageLevel).toBeCloseTo(16.833, 2);
    expect(summary.mostConnectedMii?.mii.name).toBe("Alice");
    expect(summary.mostCloseFriendsMii?.mii.name).toBe("Alice");
    expect(summary.mostCommonPersonalityGroup?.group).toBe("Reserved");
    expect(summary.friendlessCount).toBe(4);
  });

  it("counts one-sided love toward a friend as a friend tie for dashboard summaries", () => {
    const crushOnFriendStageKey =
      RELATIONSHIP_STAGE_CONFIG.stagesByType["One-sided love (friend)"][2].stageKey;
    const relationships: Relationship[] = [
      {
        id: "rel-a-b-crush",
        sourceMiiId: "mii-alice",
        targetMiiId: "mii-bob",
        relationshipType: "One-sided love (friend)",
        stageKey: crushOnFriendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
    ];

    const summary = buildDashboardSummary(fixtureMiis.slice(0, 2), relationships);
    const miiSummaryMap = buildMiiRelationshipSummaryMap(fixtureMiis.slice(0, 2), relationships);

    expect(summary.friendlessCount).toBe(1);
    expect(summary.miisNeedingFriends[0].mii.id).toBe("mii-bob");
    expect(miiSummaryMap.get("mii-alice")?.friendCount).toBe(1);
  });

  it("detects only 3+ maximal cliques of strong mutual relationships", () => {
    const relationships: Relationship[] = [
      {
        id: "rel-a-b",
        sourceMiiId: "mii-alice",
        targetMiiId: "mii-bob",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-b-a",
        sourceMiiId: "mii-bob",
        targetMiiId: "mii-alice",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-a-c",
        sourceMiiId: "mii-alice",
        targetMiiId: "mii-carol",
        relationshipType: "Sweethearts",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Sweethearts[0].stageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-c-a",
        sourceMiiId: "mii-carol",
        targetMiiId: "mii-alice",
        relationshipType: "Sweethearts",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Sweethearts[1].stageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-b-c",
        sourceMiiId: "mii-bob",
        targetMiiId: "mii-carol",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-c-b",
        sourceMiiId: "mii-carol",
        targetMiiId: "mii-bob",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-b-d",
        sourceMiiId: "mii-bob",
        targetMiiId: "mii-daisy",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-d-b",
        sourceMiiId: "mii-daisy",
        targetMiiId: "mii-bob",
        relationshipType: "Friends",
        stageKey: friendStageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-c-d",
        sourceMiiId: "mii-carol",
        targetMiiId: "mii-daisy",
        relationshipType: "Family",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Family[0].stageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
      {
        id: "rel-d-c",
        sourceMiiId: "mii-daisy",
        targetMiiId: "mii-carol",
        relationshipType: "Relatives",
        stageKey: RELATIONSHIP_STAGE_CONFIG.stagesByType.Relatives[0].stageKey,
        createdAt: "2026-04-26T18:00:00.000Z",
        updatedAt: "2026-04-26T18:00:00.000Z",
      },
    ];

    const groups = findFriendGroups(fixtureMiis.slice(0, 4), relationships);

    expect(groups).toHaveLength(2);
    expect(groups[0].memberIds).toEqual(["mii-alice", "mii-bob", "mii-carol"]);
    expect(groups[0].mutualLinkCount).toBe(3);
    expect(groups[0].directedRelationshipCount).toBe(6);
    expect(groups[1].memberIds).toEqual(["mii-bob", "mii-carol", "mii-daisy"]);
    expect(groups[1].directedRelationshipCount).toBe(6);
  });
});
