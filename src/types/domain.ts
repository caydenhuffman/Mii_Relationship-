export const PERSONALITY_TYPE_VALUES = [
  "Achiever",
  "Maverick",
  "Rogue",
  "Visionary",
  "Buddy",
  "Cheerleader",
  "Daydreamer",
  "Sweetie",
  "Charmer",
  "Dynamo",
  "Go-Getter",
  "Merrymaker",
  "Observer",
  "Perfectionist",
  "Thinker",
  "Strategist",
] as const;

export type PersonalityType = (typeof PERSONALITY_TYPE_VALUES)[number];

export const RELATIONSHIP_TYPE_VALUES = [
  "Spouses",
  "Sweethearts",
  "Friends",
  "Family",
  "Relatives",
  "Acquaintances",
  "Strangers",
  "One-sided love (friend)",
  "One-sided love (acquaintance)",
  "Ex-spouses",
  "Ex-sweethearts",
  "Ex-friends",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPE_VALUES)[number];

export interface Mii {
  id: string;
  name: string;
  personalityType: PersonalityType;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  pairId?: string;
  sourceMiiId: string;
  targetMiiId: string;
  relationshipType: RelationshipType;
  stageKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface IslandData {
  schemaVersion: number;
  updatedAt: string;
  miis: Mii[];
  relationships: Relationship[];
}

export interface RelationshipStageDefinition {
  relationshipType: RelationshipType;
  stageKey: string;
  label: string;
  description: string;
  meterMin?: number;
  meterMax?: number;
  duringFightLabel?: string;
}

export interface MiiInput {
  name: string;
  personalityType: PersonalityType;
  level: number;
}

export interface RelationshipInput {
  sourceMiiId: string;
  targetMiiId: string;
  relationshipType: RelationshipType;
  stageKey: string;
}

export interface RelationshipPairInput extends RelationshipInput {
  inverseRelationshipType: RelationshipType;
  inverseStageKey: string;
}

export type RelationshipFamily =
  | "romance"
  | "friendship"
  | "family"
  | "acquaintance"
  | "stranger"
  | "oneSidedLove"
  | "ex";
