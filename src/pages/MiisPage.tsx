import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MiiFormModal } from "@/components/forms/MiiFormModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getPersonalityGroup,
  PERSONALITY_GROUPS,
  PERSONALITY_TYPE_COLORS,
} from "@/config/personalities";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import {
  buildConnectionCountMap,
  buildMiiRelationshipSummaryMap,
} from "@/lib/analytics";
import { useIsland } from "@/hooks/useIsland";
import type { Mii } from "@/types/domain";
import pageStyles from "./Page.module.css";

type SortMode = "alphabetical" | "added";
const MII_PAGE_PREFERENCES_KEY = "tomodachi-life-relationship-tracker:mii-page-preferences";

function readSavedPreferences() {
  if (typeof window === "undefined") {
    return {
      searchValue: "",
      personalityFilter: "all",
      sortMode: "alphabetical" as SortMode,
    };
  }

  try {
    const raw = window.localStorage.getItem(MII_PAGE_PREFERENCES_KEY);

    if (!raw) {
      return {
        searchValue: "",
        personalityFilter: "all",
        sortMode: "alphabetical" as SortMode,
      };
    }

    const parsed = JSON.parse(raw) as {
      searchValue?: string;
      personalityFilter?: string;
      sortMode?: SortMode;
    };

    return {
      searchValue: parsed.searchValue ?? "",
      personalityFilter: parsed.personalityFilter ?? "all",
      sortMode:
        parsed.sortMode === "added" || parsed.sortMode === "alphabetical"
          ? parsed.sortMode
          : ("alphabetical" as SortMode),
    };
  } catch {
    return {
      searchValue: "",
      personalityFilter: "all",
      sortMode: "alphabetical" as SortMode,
    };
  }
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function MiisPage() {
  const navigate = useNavigate();
  const { islandData, addMii, updateMii, status } = useIsland();
  const savedPreferences = useMemo(() => readSavedPreferences(), []);
  const [searchValue, setSearchValue] = useState(savedPreferences.searchValue);
  const [personalityFilter, setPersonalityFilter] = useState(savedPreferences.personalityFilter);
  const [sortMode, setSortMode] = useState<SortMode>(savedPreferences.sortMode);
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
  const relationshipSummaryByMiiId = useMemo(
    () => buildMiiRelationshipSummaryMap(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      MII_PAGE_PREFERENCES_KEY,
      JSON.stringify({ searchValue, personalityFilter, sortMode }),
    );
  }, [personalityFilter, searchValue, sortMode]);

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
            const relationshipSummary = relationshipSummaryByMiiId.get(mii.id);
            const relationshipBadges = [
              relationshipSummary?.friendCount
                ? {
                    key: "friends",
                    label: pluralize(relationshipSummary.friendCount, "friend"),
                    metadata: RELATIONSHIP_TYPE_METADATA.Friends,
                  }
                : null,
              relationshipSummary?.acquaintanceCount
                ? {
                    key: "acquaintances",
                    label: pluralize(
                      relationshipSummary.acquaintanceCount,
                      "acquaintance",
                    ),
                    metadata: RELATIONSHIP_TYPE_METADATA.Acquaintances,
                  }
                : null,
              relationshipSummary?.familyCount
                ? {
                    key: "family",
                    label: pluralize(relationshipSummary.familyCount, "family"),
                    metadata: RELATIONSHIP_TYPE_METADATA.Family,
                  }
                : null,
              relationshipSummary?.spouseCount
                ? {
                    key: "spouses",
                    label: pluralize(relationshipSummary.spouseCount, "spouse"),
                    metadata: RELATIONSHIP_TYPE_METADATA.Spouses,
                  }
                : null,
              relationshipSummary?.sweetheartCount
                ? {
                    key: "sweethearts",
                    label: pluralize(
                      relationshipSummary.sweetheartCount,
                      "sweetheart",
                    ),
                    metadata: RELATIONSHIP_TYPE_METADATA.Sweethearts,
                  }
                : null,
            ].filter((value): value is NonNullable<typeof value> => Boolean(value));

            return (
              <Card key={mii.id} className={pageStyles.miiCard}>
                <div className={pageStyles.miiCardTop}>
                  <div className={pageStyles.miiIdentityBlock}>
                    <h3>{mii.name}</h3>
                    <div className={pageStyles.personalityCombo}>
                      <span
                        className={pageStyles.personalityGroupPill}
                        style={{
                          background: personalityGroup.colorToken,
                          color: "white",
                        }}
                      >
                        {personalityGroup.group}
                      </span>
                      <span
                        className={pageStyles.personalityTypePill}
                        style={{
                          background: PERSONALITY_TYPE_COLORS[mii.personalityType],
                          color: "var(--text-primary)",
                        }}
                      >
                        {mii.personalityType}
                      </span>
                    </div>
                  </div>
                  <div className={pageStyles.miiMetaGrid}>
                    <div className={pageStyles.miiMetaItem}>
                      <span className={pageStyles.miiMetaLabel}>Level</span>
                      <strong>{mii.level}</strong>
                    </div>
                    <div className={`${pageStyles.miiMetaItem} ${pageStyles.miiMetaItemWide}`}>
                      <span className={pageStyles.miiMetaLabel}>Connections</span>
                      <strong>{connectionCount}</strong>
                    </div>
                  </div>
                </div>

                {relationshipBadges.length > 0 ? (
                  <div className={pageStyles.miiBadgeRow}>
                    {relationshipBadges.map((badge) => (
                      <span
                        key={badge.key}
                        className={pageStyles.relationshipBadge}
                        style={{
                          background: badge.metadata.surfaceColor,
                          borderColor: badge.metadata.surfaceBorder,
                          color: badge.metadata.textColor,
                        }}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={pageStyles.miiCardNote}>No notable relationships yet.</p>
                )}

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
