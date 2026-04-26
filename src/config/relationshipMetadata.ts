import type { RelationshipFamily, RelationshipType } from "@/types/domain";
import { RELATIONSHIP_TYPE_VALUES } from "@/types/domain";

export const RELATIONSHIP_TYPES: RelationshipType[] = [...RELATIONSHIP_TYPE_VALUES];

export const RELATIONSHIP_TYPE_METADATA: Record<
  RelationshipType,
  {
    color: string;
    family: RelationshipFamily;
    positiveSocial: boolean;
    shortLabel: string;
    description: string;
    surfaceColor: string;
    surfaceBorder: string;
    textColor: string;
  }
> = {
  Spouses: {
    color: "var(--edge-spouses)",
    family: "romance",
    positiveSocial: true,
    shortLabel: "Spouse",
    description: "Long-term romantic bond",
    surfaceColor: "var(--surface-spouses)",
    surfaceBorder: "var(--surface-spouses-border)",
    textColor: "var(--surface-spouses-text)",
  },
  Sweethearts: {
    color: "var(--edge-sweethearts)",
    family: "romance",
    positiveSocial: true,
    shortLabel: "Sweetheart",
    description: "Current dating relationship",
    surfaceColor: "var(--surface-sweethearts)",
    surfaceBorder: "var(--surface-sweethearts-border)",
    textColor: "var(--surface-sweethearts-text)",
  },
  Friends: {
    color: "var(--edge-friends)",
    family: "friendship",
    positiveSocial: true,
    shortLabel: "Friend",
    description: "Friendship bond",
    surfaceColor: "var(--surface-friends)",
    surfaceBorder: "var(--surface-friends-border)",
    textColor: "var(--surface-friends-text)",
  },
  Family: {
    color: "var(--edge-family)",
    family: "family",
    positiveSocial: true,
    shortLabel: "Family",
    description: "Close relatives",
    surfaceColor: "var(--surface-family)",
    surfaceBorder: "var(--surface-family-border)",
    textColor: "var(--surface-family-text)",
  },
  Relatives: {
    color: "var(--edge-relatives)",
    family: "family",
    positiveSocial: true,
    shortLabel: "Relative",
    description: "Distant relatives",
    surfaceColor: "var(--surface-family)",
    surfaceBorder: "var(--surface-family-border)",
    textColor: "var(--surface-family-text)",
  },
  Acquaintances: {
    color: "var(--edge-acquaintances)",
    family: "acquaintance",
    positiveSocial: false,
    shortLabel: "Acquaintance",
    description: "Early social connection",
    surfaceColor: "var(--surface-acquaintance)",
    surfaceBorder: "var(--surface-acquaintance-border)",
    textColor: "var(--surface-acquaintance-text)",
  },
  Strangers: {
    color: "var(--edge-strangers)",
    family: "stranger",
    positiveSocial: false,
    shortLabel: "Stranger",
    description: "No relationship yet",
    surfaceColor: "var(--surface-neutral)",
    surfaceBorder: "var(--surface-neutral-border)",
    textColor: "var(--surface-neutral-text)",
  },
  "One-sided love (friend)": {
    color: "var(--edge-one-sided-friend)",
    family: "oneSidedLove",
    positiveSocial: true,
    shortLabel: "One-sided love",
    description: "Romantic feelings toward a friend",
    surfaceColor: "var(--surface-crush)",
    surfaceBorder: "var(--surface-crush-border)",
    textColor: "var(--surface-crush-text)",
  },
  "One-sided love (acquaintance)": {
    color: "var(--edge-one-sided-acquaintance)",
    family: "oneSidedLove",
    positiveSocial: false,
    shortLabel: "One-sided crush",
    description: "Romantic feelings toward an acquaintance",
    surfaceColor: "var(--surface-crush)",
    surfaceBorder: "var(--surface-crush-border)",
    textColor: "var(--surface-crush-text)",
  },
  "Ex-spouses": {
    color: "var(--edge-exes)",
    family: "ex",
    positiveSocial: false,
    shortLabel: "Ex-spouse",
    description: "Former marriage relationship",
    surfaceColor: "var(--surface-neutral)",
    surfaceBorder: "var(--surface-neutral-border)",
    textColor: "var(--surface-neutral-text)",
  },
  "Ex-sweethearts": {
    color: "var(--edge-exes)",
    family: "ex",
    positiveSocial: false,
    shortLabel: "Ex-sweetheart",
    description: "Former dating relationship",
    surfaceColor: "var(--surface-neutral)",
    surfaceBorder: "var(--surface-neutral-border)",
    textColor: "var(--surface-neutral-text)",
  },
  "Ex-friends": {
    color: "var(--edge-exes)",
    family: "ex",
    positiveSocial: false,
    shortLabel: "Ex-friend",
    description: "Former friendship",
    surfaceColor: "var(--surface-neutral)",
    surfaceBorder: "var(--surface-neutral-border)",
    textColor: "var(--surface-neutral-text)",
  },
};

export const RELATIONSHIP_LEGEND_ITEMS = [
  { label: "Spouses", color: "var(--edge-spouses)" },
  { label: "Sweethearts", color: "var(--edge-sweethearts)" },
  { label: "Friends", color: "var(--edge-friends)" },
  { label: "Family", color: "var(--edge-family)" },
  { label: "Crushes", color: "var(--edge-one-sided-friend)" },
  { label: "Acquaintances", color: "var(--edge-acquaintances)" },
];
