import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type SelectHTMLAttributes,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import { RELATIONSHIP_STAGE_CONFIG } from "@/config/relationshipStages";
import { relationshipPairFormSchema } from "@/lib/schemas";
import type {
  Mii,
  Relationship,
  RelationshipPairInput,
  RelationshipType,
} from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import styles from "./FormLayout.module.css";

type RelationshipFormValues = z.infer<typeof relationshipPairFormSchema>;

interface RelationshipFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  miis: Mii[];
  relationships: Relationship[];
  initialValue?: Relationship;
  initialInverseValue?: Relationship;
  preferredSourceMiiId?: string;
  onClose(): void;
  onSubmit(input: RelationshipPairInput): Promise<void>;
}

type RelationshipTypeGroupKey =
  | "romance"
  | "friend"
  | "family"
  | "acquaintance"
  | "crush"
  | "ex";

interface RelationshipTypeGroupConfig {
  key: RelationshipTypeGroupKey;
  label: string;
  subtitle: string;
  options: RelationshipType[];
}

interface RelationshipTypePrimaryOption {
  key: string;
  label: string;
  value?: RelationshipType;
  groupKey?: RelationshipTypeGroupKey;
  color: string;
  surfaceColor: string;
  surfaceBorder: string;
  textColor: string;
}

interface PickerSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  value: RelationshipType;
  onChange(event: ChangeEvent<HTMLSelectElement>): void;
}

const DEFAULT_RELATIONSHIP_TYPE: RelationshipType = "Friends";
const LITTLE_GUY_URL = `${import.meta.env.BASE_URL}little_guy.svg`;
const RELATIONSHIP_TYPE_GROUPS: RelationshipTypeGroupConfig[] = [
  {
    key: "romance",
    label: "Romance",
    subtitle: "Spouses, Sweethearts",
    options: ["Spouses", "Sweethearts"],
  },
  {
    key: "friend",
    label: "Friend",
    subtitle: "Friends",
    options: ["Friends"],
  },
  {
    key: "family",
    label: "Family",
    subtitle: "Family, Relatives",
    options: ["Family", "Relatives"],
  },
  {
    key: "acquaintance",
    label: "Acquaintance",
    subtitle: "Acquaintances",
    options: ["Acquaintances"],
  },
  {
    key: "crush",
    label: "Crush / One-sided Love",
    subtitle: "One-sided love (friend), One-sided love (acquaintance)",
    options: ["One-sided love (friend)", "One-sided love (acquaintance)"],
  },
  {
    key: "ex",
    label: "Ex",
    subtitle: "Ex-spouses, Ex-sweethearts, Ex-friends",
    options: ["Ex-spouses", "Ex-sweethearts", "Ex-friends"],
  },
];

const RELATIONSHIP_TYPE_PRIMARY_OPTIONS: RelationshipTypePrimaryOption[] = [
  {
    key: "Friends",
    label: "Friend",
    value: "Friends",
    color: "var(--edge-friends)",
    surfaceColor: "var(--surface-friends)",
    surfaceBorder: "var(--surface-friends-border)",
    textColor: "var(--surface-friends-text)",
  },
  {
    key: "Acquaintances",
    label: "Acquaintance",
    value: "Acquaintances",
    color: "var(--edge-acquaintances)",
    surfaceColor: "var(--surface-acquaintance)",
    surfaceBorder: "var(--surface-acquaintance-border)",
    textColor: "var(--surface-acquaintance-text)",
  },
  {
    key: "Spouses",
    label: "Spouse",
    value: "Spouses",
    color: "var(--edge-spouses)",
    surfaceColor: "var(--surface-spouses)",
    surfaceBorder: "var(--surface-spouses-border)",
    textColor: "var(--surface-spouses-text)",
  },
  {
    key: "Sweethearts",
    label: "Sweetheart",
    value: "Sweethearts",
    color: "var(--edge-sweethearts)",
    surfaceColor: "var(--surface-sweethearts)",
    surfaceBorder: "var(--surface-sweethearts-border)",
    textColor: "var(--surface-sweethearts-text)",
  },
  {
    key: "Family",
    label: "Family",
    value: "Family",
    color: "var(--edge-family)",
    surfaceColor: "var(--surface-family)",
    surfaceBorder: "var(--surface-family-border)",
    textColor: "var(--surface-family-text)",
  },
  {
    key: "Relatives",
    label: "Relatives",
    value: "Relatives",
    color: "var(--edge-relatives)",
    surfaceColor: "var(--surface-family)",
    surfaceBorder: "var(--surface-family-border)",
    textColor: "var(--surface-family-text)",
  },
  {
    key: "crush",
    label: "Crush",
    groupKey: "crush",
    color: "var(--edge-one-sided-friend)",
    surfaceColor: "var(--surface-crush)",
    surfaceBorder: "var(--surface-crush-border)",
    textColor: "var(--surface-crush-text)",
  },
  {
    key: "ex",
    label: "Ex",
    groupKey: "ex",
    color: "var(--edge-exes)",
    surfaceColor: "var(--surface-neutral)",
    surfaceBorder: "var(--surface-neutral-border)",
    textColor: "var(--surface-neutral-text)",
  },
];

const GROUP_BY_RELATIONSHIP_TYPE = new Map<RelationshipType, RelationshipTypeGroupConfig>(
  RELATIONSHIP_TYPE_GROUPS.flatMap((group) =>
    group.options.map((relationshipType) => [relationshipType, group] as const),
  ),
);

function getInitialValues(
  miis: Mii[],
  initialValue?: Relationship,
  initialInverseValue?: Relationship,
  preferredSourceMiiId?: string,
): RelationshipPairInput {
  const fallbackSourceId = preferredSourceMiiId ?? miis[0]?.id ?? "";
  const fallbackTargetId = miis.find((mii) => mii.id !== fallbackSourceId)?.id ?? "";
  const fallbackStageKey =
    RELATIONSHIP_STAGE_CONFIG.stagesByType[DEFAULT_RELATIONSHIP_TYPE][0]?.stageKey ?? "";

  return initialValue
    ? {
        sourceMiiId: initialValue.sourceMiiId,
        targetMiiId: initialValue.targetMiiId,
        relationshipType: initialValue.relationshipType,
        stageKey: initialValue.stageKey,
        inverseRelationshipType:
          initialInverseValue?.relationshipType ?? initialValue.relationshipType,
        inverseStageKey: initialInverseValue?.stageKey ?? initialValue.stageKey,
      }
    : {
        sourceMiiId: fallbackSourceId,
        targetMiiId: fallbackTargetId,
        relationshipType: DEFAULT_RELATIONSHIP_TYPE,
        stageKey: fallbackStageKey,
        inverseRelationshipType: DEFAULT_RELATIONSHIP_TYPE,
        inverseStageKey: fallbackStageKey,
      };
}

function getFirstStageKey(relationshipType: RelationshipType) {
  return RELATIONSHIP_STAGE_CONFIG.stagesByType[relationshipType][0]?.stageKey ?? "";
}

function getGroupForRelationshipType(relationshipType: RelationshipType) {
  return GROUP_BY_RELATIONSHIP_TYPE.get(relationshipType) ?? RELATIONSHIP_TYPE_GROUPS[0];
}

function LittleGuyIcon({
  color,
  small = false,
}: {
  color: string;
  small?: boolean;
}) {
  return (
    <span
      className={`${styles.littleGuyIcon} ${small ? styles.littleGuyIconSmall : ""}`.trim()}
      style={{
        backgroundColor: color,
        WebkitMask: `url("${LITTLE_GUY_URL}") center / contain no-repeat`,
        mask: `url("${LITTLE_GUY_URL}") center / contain no-repeat`,
      }}
      aria-hidden="true"
    />
  );
}

function RelationshipTypePicker({
  label,
  selectedGroupKey,
  selectedType,
  exactSelectionReady,
  onGroupChange,
  onTypeChange,
  description,
  helperText,
  error,
  selectProps,
}: {
  label: string;
  selectedGroupKey: RelationshipTypeGroupKey;
  selectedType: RelationshipType;
  exactSelectionReady: boolean;
  onGroupChange(groupKey: RelationshipTypeGroupKey): void;
  onTypeChange(relationshipType: RelationshipType): void;
  description: string;
  helperText?: string;
  error?: string;
  selectProps: PickerSelectProps;
}) {
  const selectId = useId();
  const descriptionId = useId();
  const helperId = useId();
  const errorId = useId();
  const activeGroup =
    RELATIONSHIP_TYPE_GROUPS.find((group) => group.key === selectedGroupKey) ??
    getGroupForRelationshipType(selectedType);
  const describedBy = [descriptionId, helperText ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");
  const needsExactTypeSelection =
    selectedGroupKey === "crush" || selectedGroupKey === "ex";
  const primaryDescription = exactSelectionReady
    ? description
    : needsExactTypeSelection
      ? `Pick the exact ${activeGroup.label.toLowerCase()} type to unlock relationship levels.`
      : description;

  return (
    <div className={styles.typePicker}>
      <label htmlFor={selectId}>{label}</label>
      <select
        {...selectProps}
        id={selectId}
        className={styles.visuallyHiddenSelect}
        tabIndex={-1}
        aria-describedby={describedBy || undefined}
      >
        {RELATIONSHIP_TYPE_GROUPS.flatMap((group) =>
          group.options.map((relationshipType) => (
            <option key={relationshipType} value={relationshipType}>
              {relationshipType}
            </option>
          )),
        )}
      </select>

      <div className={styles.primaryTypeGrid}>
        {RELATIONSHIP_TYPE_PRIMARY_OPTIONS.map((option) => {
          const isSelected = option.value
            ? selectedType === option.value && exactSelectionReady
            : selectedGroupKey === option.groupKey;

          return (
            <button
              key={option.key}
              type="button"
              className={`${styles.primaryTypeCard} ${isSelected ? styles.primaryTypeCardSelected : ""}`.trim()}
              style={{
                background: option.surfaceColor,
                borderColor: isSelected ? "var(--text-primary)" : option.surfaceBorder,
                color: option.textColor,
              }}
              onClick={() =>
                option.value
                  ? onTypeChange(option.value)
                  : option.groupKey
                    ? onGroupChange(option.groupKey)
                    : undefined
              }
            >
              <LittleGuyIcon color={option.color} small />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {needsExactTypeSelection ? (
        <div className={styles.exactTypeSection}>
          <div className={styles.exactTypeHeader}>
            <strong>Exact relationship type</strong>
            <span>{activeGroup.label}</span>
          </div>
          <div className={styles.exactTypeGrid}>
            {activeGroup.options.map((relationshipType) => {
              const metadata = RELATIONSHIP_TYPE_METADATA[relationshipType];
              const isSelected = exactSelectionReady && relationshipType === selectedType;

              return (
                <button
                  key={relationshipType}
                  type="button"
                  className={`${styles.exactTypeCard} ${isSelected ? styles.exactTypeCardSelected : ""}`.trim()}
                  style={{
                    background: metadata.surfaceColor,
                    borderColor: isSelected ? "var(--text-primary)" : metadata.surfaceBorder,
                    color: metadata.textColor,
                  }}
                  onClick={() => onTypeChange(relationshipType)}
                >
                  <LittleGuyIcon color={metadata.color} small />
                  <span>{relationshipType}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <span id={descriptionId} className={styles.helper}>
        {primaryDescription}
      </span>
      {helperText ? (
        <span id={helperId} className={styles.helper}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function RelationshipFormModal({
  open,
  mode,
  miis,
  relationships,
  initialValue,
  initialInverseValue,
  preferredSourceMiiId,
  onClose,
  onSubmit,
}: RelationshipFormModalProps) {
  const defaultValues = getInitialValues(
    miis,
    initialValue,
    initialInverseValue,
    preferredSourceMiiId,
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipPairFormSchema),
    defaultValues,
  });

  const [inverseTypeLinked, setInverseTypeLinked] = useState(
    defaultValues.relationshipType === defaultValues.inverseRelationshipType,
  );
  const [inverseStageLinked, setInverseStageLinked] = useState(
    defaultValues.relationshipType === defaultValues.inverseRelationshipType &&
      defaultValues.stageKey === defaultValues.inverseStageKey,
  );
  const [selectedGroupKey, setSelectedGroupKey] = useState<RelationshipTypeGroupKey>(
    getGroupForRelationshipType(defaultValues.relationshipType).key,
  );
  const [selectedInverseGroupKey, setSelectedInverseGroupKey] =
    useState<RelationshipTypeGroupKey>(
      getGroupForRelationshipType(defaultValues.inverseRelationshipType).key,
    );

  const selectedSourceMiiId = watch("sourceMiiId");
  const selectedTargetMiiId = watch("targetMiiId");
  const selectedType = watch("relationshipType");
  const selectedStageKey = watch("stageKey");
  const selectedInverseType = watch("inverseRelationshipType");
  const selectedInverseStageKey = watch("inverseStageKey");

  const editableRelationshipIds = useMemo(
    () =>
      new Set(
        [initialValue?.id, initialInverseValue?.id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    [initialInverseValue?.id, initialValue?.id],
  );

  const availableStages = RELATIONSHIP_STAGE_CONFIG.stagesByType[selectedType] ?? [];
  const selectedStage = availableStages.find((stage) => stage.stageKey === selectedStageKey);
  const availableInverseStages =
    RELATIONSHIP_STAGE_CONFIG.stagesByType[selectedInverseType] ?? [];
  const selectedInverseStage = availableInverseStages.find(
    (stage) => stage.stageKey === selectedInverseStageKey,
  );

  const availableTargetMiis = useMemo(
    () =>
      miis.filter((mii) => {
        if (mii.id === selectedSourceMiiId) {
          return false;
        }

        if (mii.id === selectedTargetMiiId && editableRelationshipIds.size > 0) {
          return true;
        }

        return !relationships.some(
          (relationship) =>
            !editableRelationshipIds.has(relationship.id) &&
            ((relationship.sourceMiiId === selectedSourceMiiId &&
              relationship.targetMiiId === mii.id) ||
              (relationship.sourceMiiId === mii.id &&
                relationship.targetMiiId === selectedSourceMiiId)),
        );
      }),
    [
      editableRelationshipIds,
      miis,
      relationships,
      selectedSourceMiiId,
      selectedTargetMiiId,
    ],
  );

  const sourceMiiName =
    miis.find((mii) => mii.id === selectedSourceMiiId)?.name ?? "Source Mii";
  const targetMiiName =
    miis.find((mii) => mii.id === selectedTargetMiiId)?.name ?? "Target Mii";

  const exactTypeReady =
    getGroupForRelationshipType(selectedType).key === selectedGroupKey;
  const exactInverseTypeReady =
    getGroupForRelationshipType(selectedInverseType).key === selectedInverseGroupKey;

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextDefaults = getInitialValues(
      miis,
      initialValue,
      initialInverseValue,
      preferredSourceMiiId,
    );

    reset(nextDefaults);
    clearErrors();
    setInverseTypeLinked(
      nextDefaults.relationshipType === nextDefaults.inverseRelationshipType,
    );
    setInverseStageLinked(
      nextDefaults.relationshipType === nextDefaults.inverseRelationshipType &&
        nextDefaults.stageKey === nextDefaults.inverseStageKey,
    );
    setSelectedGroupKey(getGroupForRelationshipType(nextDefaults.relationshipType).key);
    setSelectedInverseGroupKey(
      getGroupForRelationshipType(nextDefaults.inverseRelationshipType).key,
    );
  }, [clearErrors, initialInverseValue, initialValue, miis, open, preferredSourceMiiId, reset]);

  useEffect(() => {
    if (!availableStages.some((stage) => stage.stageKey === selectedStageKey)) {
      setValue("stageKey", availableStages[0]?.stageKey ?? "");
    }
  }, [availableStages, selectedStageKey, setValue]);

  useEffect(() => {
    if (
      !availableInverseStages.some((stage) => stage.stageKey === selectedInverseStageKey)
    ) {
      setValue("inverseStageKey", availableInverseStages[0]?.stageKey ?? "");
    }
  }, [availableInverseStages, selectedInverseStageKey, setValue]);

  useEffect(() => {
    if (availableTargetMiis.some((mii) => mii.id === selectedTargetMiiId)) {
      return;
    }

    setValue("targetMiiId", availableTargetMiis[0]?.id ?? "");
  }, [availableTargetMiis, selectedTargetMiiId, setValue]);

  const relationshipTypeRegister = register("relationshipType");
  const stageKeyRegister = register("stageKey");
  const inverseRelationshipTypeRegister = register("inverseRelationshipType");
  const inverseStageKeyRegister = register("inverseStageKey");

  function syncInverseStage(nextType: RelationshipType, nextStageKey: string) {
    if (!inverseStageLinked) {
      return;
    }

    if (inverseTypeLinked || selectedInverseType === nextType) {
      setValue("inverseStageKey", nextStageKey);
      return;
    }

    setValue("inverseStageKey", getFirstStageKey(selectedInverseType));
  }

  function applyRelationshipType(nextType: RelationshipType) {
    relationshipTypeRegister.onChange({
      target: { name: relationshipTypeRegister.name, value: nextType },
    });

    const nextStageKey = getFirstStageKey(nextType);
    setValue("stageKey", nextStageKey);
    setSelectedGroupKey(getGroupForRelationshipType(nextType).key);

    if (inverseTypeLinked) {
      inverseRelationshipTypeRegister.onChange({
        target: { name: inverseRelationshipTypeRegister.name, value: nextType },
      });
      setValue("inverseRelationshipType", nextType);
      setValue("inverseStageKey", nextStageKey);
      setSelectedInverseGroupKey(getGroupForRelationshipType(nextType).key);
    } else {
      syncInverseStage(nextType, nextStageKey);
    }
  }

  function applyInverseRelationshipType(nextType: RelationshipType) {
    inverseRelationshipTypeRegister.onChange({
      target: { name: inverseRelationshipTypeRegister.name, value: nextType },
    });

    const nextStageKey =
      nextType === selectedType ? selectedStageKey : getFirstStageKey(nextType);

    setValue("inverseRelationshipType", nextType);
    setValue("inverseStageKey", nextStageKey);
    setSelectedInverseGroupKey(getGroupForRelationshipType(nextType).key);
    setInverseTypeLinked(nextType === selectedType);
    setInverseStageLinked(
      nextType === selectedType && nextStageKey === selectedStageKey,
    );
  }

  function handleGroupChange(groupKey: RelationshipTypeGroupKey) {
    const group = RELATIONSHIP_TYPE_GROUPS.find((item) => item.key === groupKey);

    if (!group) {
      return;
    }

    setSelectedGroupKey(group.key);

    if (group.options.length === 1) {
      applyRelationshipType(group.options[0]);
    }
  }

  function handleInverseGroupChange(groupKey: RelationshipTypeGroupKey) {
    const group = RELATIONSHIP_TYPE_GROUPS.find((item) => item.key === groupKey);

    if (!group) {
      return;
    }

    setSelectedInverseGroupKey(group.key);
    setInverseTypeLinked(false);

    if (group.options.length === 1) {
      applyInverseRelationshipType(group.options[0]);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add reciprocal relationship" : "Edit reciprocal relationship"}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(values as RelationshipPairInput);
            onClose();
          } catch (error) {
            setError("root", {
              type: "server",
              message:
                error instanceof Error
                  ? error.message
                  : "Couldn't save that relationship pair.",
            });
          }
        })}
      >
        <div className={styles.grid}>
          <label>
            Source Mii
            <select {...register("sourceMiiId")}>
              {miis.map((mii) => (
                <option key={mii.id} value={mii.id}>
                  {mii.name}
                </option>
              ))}
            </select>
            {errors.sourceMiiId ? (
              <span className={styles.error}>{errors.sourceMiiId.message}</span>
            ) : null}
          </label>

          <label>
            Target Mii
            <select {...register("targetMiiId")}>
              {availableTargetMiis.map((mii) => (
                <option key={mii.id} value={mii.id}>
                  {mii.name}
                </option>
              ))}
            </select>
            {errors.targetMiiId ? (
              <span className={styles.error}>{errors.targetMiiId.message}</span>
            ) : null}
            {!availableTargetMiis.length ? (
              <span className={styles.helper}>
                No available target Miis for this source. Every valid pair already exists.
              </span>
            ) : null}
          </label>
        </div>

        <div className={styles.pickerStack}>
          <RelationshipTypePicker
            label="Relationship type"
            selectedGroupKey={selectedGroupKey}
            selectedType={selectedType}
            exactSelectionReady={exactTypeReady}
            onGroupChange={handleGroupChange}
            onTypeChange={applyRelationshipType}
            description={RELATIONSHIP_TYPE_METADATA[selectedType].description}
            error={errors.relationshipType?.message}
            selectProps={{
              ...relationshipTypeRegister,
              value: selectedType,
              onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                applyRelationshipType(event.target.value as RelationshipType);
              },
            }}
          />

          <label>
            Relationship level
            <select
              {...stageKeyRegister}
              disabled={!exactTypeReady}
              onChange={(event) => {
                stageKeyRegister.onChange(event);
                syncInverseStage(selectedType, event.target.value);
              }}
            >
              {availableStages.map((stage) => (
                <option key={stage.stageKey} value={stage.stageKey}>
                  {stage.label}
                </option>
              ))}
            </select>
            {errors.stageKey ? (
              <span className={styles.error}>{errors.stageKey.message}</span>
            ) : null}
          </label>
        </div>

        {selectedStage ? (
          <div className={styles.stageCard}>
            <strong>{`${sourceMiiName} -> ${targetMiiName}`}</strong>
            <div>
              {selectedType}: {selectedStage.label}
            </div>
          </div>
        ) : null}

        <div className={styles.pickerStack}>
          <RelationshipTypePicker
            label="Inverse relationship type"
            selectedGroupKey={selectedInverseGroupKey}
            selectedType={selectedInverseType}
            exactSelectionReady={exactInverseTypeReady}
            onGroupChange={handleInverseGroupChange}
            onTypeChange={applyInverseRelationshipType}
            description={RELATIONSHIP_TYPE_METADATA[selectedInverseType].description}
            helperText="Starts mirrored from the first Mii, but you can change it if the feeling is different."
            error={errors.inverseRelationshipType?.message}
            selectProps={{
              ...inverseRelationshipTypeRegister,
              value: selectedInverseType,
              onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                applyInverseRelationshipType(event.target.value as RelationshipType);
              },
            }}
          />

          <label>
            Inverse relationship level
            <select
              {...inverseStageKeyRegister}
              disabled={!exactInverseTypeReady}
              onChange={(event) => {
                inverseStageKeyRegister.onChange(event);
                setInverseStageLinked(
                  selectedInverseType === selectedType &&
                    event.target.value === selectedStageKey,
                );
              }}
            >
              {availableInverseStages.map((stage) => (
                <option key={`inverse-${stage.stageKey}`} value={stage.stageKey}>
                  {stage.label}
                </option>
              ))}
            </select>
            {errors.inverseStageKey ? (
              <span className={styles.error}>{errors.inverseStageKey.message}</span>
            ) : null}
          </label>
        </div>

        {selectedInverseStage ? (
          <div className={styles.stageCard}>
            <strong>{`${targetMiiName} -> ${sourceMiiName}`}</strong>
            <div>
              {selectedInverseType}: {selectedInverseStage.label}
            </div>
          </div>
        ) : null}

        {errors.root?.message ? (
          <div className={styles.errorBanner}>{errors.root.message}</div>
        ) : null}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            miis.length < 2 ||
            availableTargetMiis.length === 0 ||
            !exactTypeReady ||
            !exactInverseTypeReady
          }
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create reciprocal relationship"
              : "Save both directions"}
        </Button>
      </form>
    </Modal>
  );
}
