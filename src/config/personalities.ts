import {
  PERSONALITY_TYPE_VALUES,
  type PersonalityType,
} from "@/types/domain";

export const PERSONALITY_GROUPS = [
  {
    group: "Ambitious",
    colorToken: "var(--group-ambitious)",
    types: ["Achiever", "Maverick", "Rogue", "Visionary"],
  },
  {
    group: "Considerate",
    colorToken: "var(--group-considerate)",
    types: ["Buddy", "Cheerleader", "Daydreamer", "Sweetie"],
  },
  {
    group: "Outgoing",
    colorToken: "var(--group-outgoing)",
    types: ["Charmer", "Dynamo", "Go-Getter", "Merrymaker"],
  },
  {
    group: "Reserved",
    colorToken: "var(--group-reserved)",
    types: ["Observer", "Perfectionist", "Thinker", "Strategist"],
  },
] as const satisfies ReadonlyArray<{
  group: string;
  colorToken: string;
  types: readonly PersonalityType[];
}>;

export const PERSONALITY_TYPES = [...PERSONALITY_TYPE_VALUES];

export function getPersonalityGroup(personalityType: PersonalityType) {
  return (
    PERSONALITY_GROUPS.find((group) =>
      (group.types as readonly PersonalityType[]).includes(personalityType),
    ) ??
    PERSONALITY_GROUPS[0]
  );
}
