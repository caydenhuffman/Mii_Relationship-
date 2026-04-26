import { z } from "zod";
import {
  RELATIONSHIP_STAGE_CONFIG,
  getStageDefinition,
} from "@/config/relationshipStages";
import {
  PERSONALITY_TYPE_VALUES,
  RELATIONSHIP_TYPE_VALUES,
} from "@/types/domain";

export const miiSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  personalityType: z.enum(PERSONALITY_TYPE_VALUES),
  level: z.number().int().min(1).max(999),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const relationshipSchema = z.object({
  id: z.string().min(1),
  pairId: z.string().min(1).optional(),
  sourceMiiId: z.string().min(1),
  targetMiiId: z.string().min(1),
  relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
  stageKey: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const islandDataSchema = z.object({
  schemaVersion: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  miis: z.array(miiSchema),
  relationships: z.array(relationshipSchema),
});

export const miiFormSchema = z.object({
  name: z.string().trim().min(1, "Give this Mii a name."),
  personalityType: z.enum(PERSONALITY_TYPE_VALUES),
  level: z.coerce
    .number()
    .int("Level must be a whole number.")
    .min(1, "Level must be at least 1.")
    .max(999, "Level must be 999 or less."),
});

export const relationshipPairFormSchema = z
  .object({
    sourceMiiId: z.string().min(1, "Choose who owns this feeling."),
    targetMiiId: z.string().min(1, "Choose who the feeling is about."),
    relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
    stageKey: z.string().min(1, "Choose a stage."),
    inverseRelationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
    inverseStageKey: z.string().min(1, "Choose the inverse stage."),
  })
  .superRefine((value, context) => {
    if (value.sourceMiiId === value.targetMiiId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetMiiId"],
        message: "A Mii can't point a relationship at themself.",
      });
    }

    const stageDefinition = getStageDefinition(value.stageKey);

    if (!stageDefinition) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stageKey"],
        message: "Choose a valid stage for this relationship.",
      });
      return;
    }

    if (stageDefinition.relationshipType !== value.relationshipType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stageKey"],
        message: "That stage does not belong to the selected relationship type.",
      });
    }

    const inverseStageDefinition = getStageDefinition(value.inverseStageKey);

    if (!inverseStageDefinition) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inverseStageKey"],
        message: "Choose a valid stage for the inverse relationship.",
      });
      return;
    }

    if (inverseStageDefinition.relationshipType !== value.inverseRelationshipType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inverseStageKey"],
        message: "That inverse stage does not belong to the selected relationship type.",
      });
    }
  });

export const relationshipStageDefinitionSchema = z.object({
  relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
  stageKey: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  meterMin: z.number().optional(),
  meterMax: z.number().optional(),
  duringFightLabel: z.string().optional(),
});

export function getStagesForRelationshipType(relationshipType: string) {
  return RELATIONSHIP_STAGE_CONFIG.stagesByType[relationshipType as keyof typeof RELATIONSHIP_STAGE_CONFIG.stagesByType] ?? [];
}
