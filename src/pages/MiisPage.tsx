import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MiiFormModal } from "@/components/forms/MiiFormModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPersonalityGroup, PERSONALITY_GROUPS } from "@/config/personalities";
import { buildConnectionCountMap } from "@/lib/analytics";
import { useIsland } from "@/hooks/useIsland";
import type { Mii } from "@/types/domain";
import pageStyles from "./Page.module.css";

type SortMode = "alphabetical" | "added";

export function MiisPage() {
  const navigate = useNavigate();
  const { islandData, addMii, updateMii, status } = useIsland();
  const [searchValue, setSearchValue] = useState("");
  const [personalityFilter, setPersonalityFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMii, setEditingMii] = useState<Mii | undefined>();
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredMiis = useMemo(
    () =>
      islandData.miis
        .filter((mii) =>
          mii.name.toLowerCase().includes(deferredSearchValue.trim().toLowerCase()),
        )
        .filter((mii) =>
          personalityFilter === "all" ? true : mii.personalityType === personalityFilter,
        )
        .sort((left, right) => {
          if (sortMode === "added") {
            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
          }

          return left.name.localeCompare(right.name);
        }),
    [deferredSearchValue, islandData.miis, personalityFilter, sortMode],
  );
  const connectionCountByMiiId = useMemo(
    () => buildConnectionCountMap(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Miis</h2>
          <p>
            Browse your island roster, check each Mii’s connection count, and jump into
            their profile for full relationship management.
          </p>
        </div>
        <div className={pageStyles.toolbar}>
          <Button onClick={() => setCreateOpen(true)}>Add Mii</Button>
        </div>
      </div>

      <div className={pageStyles.filterRowWide}>
        <label>
          Search by name
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search Miis"
          />
        </label>
        <label>
          Filter by personality
          <select
            value={personalityFilter}
            onChange={(event) => setPersonalityFilter(event.target.value)}
          >
            <option value="all">All personalities</option>
            {PERSONALITY_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.types.map((personalityType) => (
                  <option key={personalityType} value={personalityType}>
                    {personalityType}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="alphabetical">Alphabetical</option>
            <option value="added">Order added</option>
          </select>
        </label>
      </div>

      {islandData.miis.length === 0 ? (
        <EmptyState
          title="No Miis yet"
          description="Create your first Mii profile to start building the island."
          actionLabel="Add your first Mii"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <section className={pageStyles.miiGrid}>
          {filteredMiis.map((mii) => {
            const personalityGroup = getPersonalityGroup(mii.personalityType);
            const connectionCount = connectionCountByMiiId.get(mii.id) ?? 0;

            return (
              <Card key={mii.id}>
                <div className={pageStyles.itemRow}>
                  <div>
                    <h3>{mii.name}</h3>
                    <div className={pageStyles.meta}>
                      <span
                        className={pageStyles.pill}
                        style={{
                          background: `${personalityGroup.colorToken}2a`,
                          color: "var(--text-primary)",
                        }}
                      >
                        {personalityGroup.group}
                      </span>
                      <span className={pageStyles.tag}>{mii.personalityType}</span>
                      <span className={pageStyles.tag}>Level {mii.level}</span>
                      <span className={pageStyles.tag}>{connectionCount} connections</span>
                    </div>
                  </div>
                </div>

                <div className={pageStyles.toolbar}>
                  <Button
                    variant="primary"
                    aria-label={`Open ${mii.name}'s profile`}
                    onClick={() => navigate(`/miis/${mii.id}`)}
                  >
                    Open profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingMii(mii)}
                    aria-label={`Edit ${mii.name}`}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {islandData.miis.length > 0 && filteredMiis.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different name search, personality filter, or sort."
        />
      ) : null}

      <MiiFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={addMii}
      />

      <MiiFormModal
        open={Boolean(editingMii)}
        mode="edit"
        initialValue={editingMii}
        onClose={() => setEditingMii(undefined)}
        onSubmit={async (input) => {
          if (!editingMii) {
            return;
          }

          await updateMii(editingMii.id, input);
        }}
      />
    </div>
  );
}
