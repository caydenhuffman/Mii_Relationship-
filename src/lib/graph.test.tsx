import { render, screen } from "@testing-library/react";
import {
  buildClusterOverviewGraph,
  buildFocusedRelationshipGraph,
  buildFullRelationshipGraph,
} from "@/lib/graph";
import { fixtureMiis, fixtureRelationships, sampleIslandData } from "@/tests/fixtures";

describe("graph builders", () => {
  it("creates one node per Mii and collapses reciprocal pairs into compact graph edges", () => {
    const graph = buildFullRelationshipGraph(
      sampleIslandData.miis,
      sampleIslandData.relationships,
    );

    expect(graph.nodes).toHaveLength(sampleIslandData.miis.length);
    expect(graph.edges).toHaveLength(4);
  });

  it("filters the focused graph down to the selected Mii's positive-social network", () => {
    const graph = buildFocusedRelationshipGraph(
      "mii-alice",
      sampleIslandData.miis,
      sampleIslandData.relationships,
    );

    expect(graph.nodes.map((node) => node.id).sort()).toEqual([
      "mii-alice",
      "mii-bob",
      "mii-carol",
      "mii-evan",
    ]);
    expect(graph.edges).toHaveLength(3);
    expect(graph.edges.every((edge) => edge.id !== "rel-daisy-alice")).toBe(true);

    const bobNode = graph.nodes.find((node) => node.id === "mii-bob");
    render(<>{bobNode?.data.label}</>);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Bob -> Alice")).toBeInTheDocument();
    expect(screen.getByText("Friends: Great friends")).toBeInTheDocument();
    expect(screen.getByText("Bob <- Alice")).toBeInTheDocument();
  });

  it("builds a cluster overview graph for a set of cluster members", () => {
    const members = fixtureMiis.slice(0, 3);
    const relationships = fixtureRelationships.filter(
      (relationship) =>
        ["mii-alice", "mii-bob", "mii-carol"].includes(relationship.sourceMiiId) &&
        ["mii-alice", "mii-bob", "mii-carol"].includes(relationship.targetMiiId),
    );

    const graph = buildClusterOverviewGraph(members, relationships);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(4);
    expect(graph.nodes.every((node) => node.type === "clusterNode")).toBe(true);
    expect(graph.edges.every((edge) => edge.type === "default")).toBe(true);
  });
});
