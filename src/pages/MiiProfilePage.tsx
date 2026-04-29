import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MiiFormModal } from "@/components/forms/MiiFormModal";
import { RelationshipFormModal } from "@/components/forms/RelationshipFormModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useIsland } from "@/hooks/useIsland";
import { getPersonalityGroup } from "@/config/personalities";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import {
  type RankedRelationship,
  buildRankedRelationshipsForMii,
  getConnectionCount,
  getRelationshipStageLabel,
} from "@/lib/analytics";
import { findReciprocalRelationship } from "@/lib/islandMutations";
import type { Relationship } from "@/types/domain";
import pageStyles from "./Page.module.css";

function RelationshipRankingList({
  miiName,
  relationships,
  onEdit,
  onDelete,
}: {
  miiName: string;
  relationships: RankedRelationship[];
  onEdit(relationship: Relationship): void;
  onDelete(relationshipId: string): Promise<void>;
}) {
  return (
    <Card>
      <div className={pageStyles.sectionTitle}>
        <div>
          <h3>Relationships</h3>
          <p>Ranked by how intense this Mii's feelings are right now.</p>
        </div>
        <span className={pageStyles.pill}>{relationships.length}</span>
      </div>
      {relationships.length === 0 ? (
        <p>No relationships yet.</p>
      ) : (
        <div className={pageStyles.list}>
          {relationships.map((relationship, index) => {
            const metadata =
              RELATIONSHIP_TYPE_METADATA[relationship.outgoingRelationship.relationshipType];
            const outgoingLevel = getRelationshipStageLabel(
              relationship.outgoingRelationship.stageKey,
            );
            const incomingLevel = relationship.incomingRelationship
              ? getRelationshipStageLabel(relationship.incomingRelationship.stageKey)
              : "No matching return relationship";

            return (
              <div
                key={relationship.outgoingRelationship.id}
                className={pageStyles.relationshipCard}
                style={{
                  background: metadata.surfaceColor,
                  borderColor: metadata.surfaceBorder,
                  color: metadata.textColor,
                }}
              >
                <div className={pageStyles.itemRow}>
                  <div>
                    <h4>
                      {index + 1}. {relationship.counterparty.name}
                    </h4>
                    <div className={pageStyles.meta}>
                      <span
                        className={pageStyles.pill}
                        style={{
                          background: metadata.color,
                          color: "white",
                        }}
                      >
                        {outgoingLevel}
                      </span>
                      <span className={pageStyles.tag}>{metadata.shortLabel}</span>
                    </div>
                  </div>
                  <div className={pageStyles.toolbar}>
                    <Button
                      variant="secondary"
                      aria-label={`Edit relationship with ${relationship.counterparty.name}`}
                      onClick={() => onEdit(relationship.outgoingRelationship)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      aria-label={`Delete relationship with ${relationship.counterparty.name}`}
                      onClick={() => onDelete(relationship.outgoingRelationship.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {relationship.incomingRelationship ? (
                  <div className={pageStyles.relationshipSummary}>
                    <div>{`${relationship.counterparty.name} -> ${miiName}`}</div>
                    <div>
                      {relationship.incomingRelationship.relationshipType}: {incomingLevel}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function MiiProfilePage() {
  const { miiId } = useParams();
  const navigate = useNavigate();
  const {
    islandData,
    updateMii,
    deleteMii,
    addRelationshipPair,
    updateRelationshipPair,
    deleteRelationshipPair,
    status,
  } = useIsland();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateRelationshipOpen, setIsCreateRelationshipOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | undefined>();
  const mii = islandData.miis.find((entry) => entry.id === miiId);
  const selectedMiiId = mii?.id ?? "";
  const relationshipRankings = useMemo(
    () =>
      selectedMiiId
        ? buildRankedRelationshipsForMii(selectedMiiId, islandData.miis, islandData.relationships)
        : [],
    [selectedMiiId, islandData.miis, islandData.relationships],
  );
  const connectionCount = useMemo(
    () => (selectedMiiId ? getConnectionCount(selectedMiiId, islandData.relationships) : 0),
    [selectedMiiId, islandData.relationships],
  );

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  if (!mii) {
    return (
      <EmptyState
        title="Mii not found"
        description="This profile no longer exists, or the link is pointing to an older island state."
        actionLabel="Back to Miis"
        actionTo="/miis"
      />
    );
  }

  const personalityGroup = getPersonalityGroup(mii.personalityType);

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <Link className={pageStyles.linkButton} to="/miis">
            {"<- Back to Miis"}
          </Link>
          <h2>{mii.name}</h2>
          <p>
            See {mii.name}'s strongest connections, inspect both sides of each
            relationship, and manage everything from one profile.
          </p>
        </div>
        <div className={pageStyles.toolbar}>
          <Button onClick={() => setIsCreateRelationshipOpen(true)}>Add relationship</Button>
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Mii
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (
                window.confirm(
                  `Delete ${mii.name}? This also removes every relationship connected to them.`,
                )
              ) {
                await deleteMii(mii.id);
                navigate("/miis");
              }
            }}
          >
            Delete Mii
          </Button>
        </div>
      </div>

      <Card className={pageStyles.heroCard}>
        <div className={pageStyles.heroMeta}>
          <span
            className={pageStyles.pill}
            style={{ background: `${personalityGroup.colorToken}26`, color: "var(--text-primary)" }}
          >
            {personalityGroup.group}
          </span>
          <span className={pageStyles.tag}>{mii.personalityType}</span>
          <span className={pageStyles.tag}>Level {mii.level}</span>
          <span className={pageStyles.tag}>{connectionCount} connections</span>
        </div>
        <div className={pageStyles.note}>
          Relationships are ranked by the current Mii's side first, with the return
          feeling right underneath for quick comparison.
        </div>
      </Card>

      <RelationshipRankingList
        miiName={mii.name}
        relationships={relationshipRankings}
        onEdit={setEditingRelationship}
        onDelete={async (relationshipId) => {
          if (window.confirm("Delete this reciprocal relationship in both directions?")) {
            await deleteRelationshipPair(relationshipId);
          }
        }}
      />

      <MiiFormModal
        open={isEditOpen}
        mode="edit"
        initialValue={mii}
        onClose={() => setIsEditOpen(false)}
        onSubmit={async (input) => {
          await updateMii(mii.id, input);
        }}
      />

      <RelationshipFormModal
        open={isCreateRelationshipOpen}
        mode="create"
        miis={islandData.miis}
        relationships={islandData.relationships}
        preferredSourceMiiId={mii.id}
        onClose={() => setIsCreateRelationshipOpen(false)}
        onSubmit={addRelationshipPair}
      />

      <RelationshipFormModal
        open={Boolean(editingRelationship)}
        mode="edit"
        miis={islandData.miis}
        relationships={islandData.relationships}
        initialValue={editingRelationship}
        initialInverseValue={
          editingRelationship
            ? findReciprocalRelationship(islandData.relationships, editingRelationship)
            : undefined
        }
        onClose={() => setEditingRelationship(undefined)}
        onSubmit={async (input) => {
          if (!editingRelationship) {
            return;
          }

          await updateRelationshipPair(editingRelationship.id, input);
        }}
      />
    </div>
  );
}
