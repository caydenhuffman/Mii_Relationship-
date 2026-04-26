import Papa from "papaparse";
import { z } from "zod";
import relationshipLevelsCsv from "../../Tomadachi_relationships/relationship_levels.csv?raw";
import { RELATIONSHIP_TYPES } from "@/config/relationshipMetadata";
import { slugify } from "@/lib/slug";
import type {
  RelationshipStageDefinition,
  RelationshipType,
} from "@/types/domain";

const csvRowSchema = z.object({
  relationship_type: z.string().min(1),
  description: z.string().default(""),
  meter_min: z.string().optional().nullable(),
  meter_max: z.string().optional().nullable(),
  stage: z.string().min(1),
  during_fight: z.string().optional().nullable(),
});

function normalizeNumber(value?: string | null) {
  if (!value || value.trim() === "") {
    return undefined;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseRelationshipStages() {
  const parsed = Papa.parse<Record<string, string>>(relationshipLevelsCsv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Failed to parse relationship stage CSV.");
  }

  const allStages: RelationshipStageDefinition[] = [];
  const counters = new Map<RelationshipType, number>();

  for (const row of parsed.data) {
    const validated = csvRowSchema.parse(row);
    const relationshipType = validated.relationship_type as RelationshipType;

    if (!RELATIONSHIP_TYPES.includes(relationshipType)) {
      throw new Error(`Unknown relationship type in CSV: ${validated.relationship_type}`);
    }

    const index = counters.get(relationshipType) ?? 0;
    counters.set(relationshipType, index + 1);

    allStages.push({
      relationshipType,
      stageKey: `${slugify(relationshipType)}:${index}`,
      label: validated.stage,
      description: validated.description,
      meterMin: normalizeNumber(validated.meter_min),
      meterMax: normalizeNumber(validated.meter_max),
      duringFightLabel: validated.during_fight?.trim() || undefined,
    });
  }

  const stagesByType = RELATIONSHIP_TYPES.reduce(
    (accumulator, relationshipType) => {
      accumulator[relationshipType] = allStages.filter(
        (stage) => stage.relationshipType === relationshipType,
      );
      return accumulator;
    },
    {} as Record<RelationshipType, RelationshipStageDefinition[]>,
  );

  const stageByKey = allStages.reduce(
    (accumulator, stage) => {
      accumulator[stage.stageKey] = stage;
      return accumulator;
    },
    {} as Record<string, RelationshipStageDefinition>,
  );

  return {
    allStages,
    stagesByType,
    stageByKey,
  };
}

export const RELATIONSHIP_STAGE_CONFIG = parseRelationshipStages();

export function getStageDefinition(stageKey: string) {
  return RELATIONSHIP_STAGE_CONFIG.stageByKey[stageKey];
}
