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

export const PERSONALITY_TYPE_COLORS: Record<PersonalityType, string> = {
  Sweetie: "#fdf3c2",
  Cheerleader: "#fff44d",
  Buddy: "#ffda55",
  Daydreamer: "#ffc677",
  Charmer: "#ffa0c2",
  "Go-Getter": "#ff5561",
  Merrymaker: "#fa8f7d",
  Dynamo: "#fb7b4a",
  Strategist: "#a0de63",
  Perfectionist: "#02d0a2",
  Observer: "#429794",
  Thinker: "#29af66",
  Achiever: "#7ae1f4",
  Visionary: "#42a6f2",
  Rogue: "#6f7cef",
  Maverick: "#a583f3",
};

export function getPersonalityGroup(personalityType: PersonalityType) {
  return (
    PERSONALITY_GROUPS.find((group) =>
      (group.types as readonly PersonalityType[]).includes(personalityType),
    ) ??
    PERSONALITY_GROUPS[0]
  );
}
