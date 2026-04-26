import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  RELATIONSHIP_TYPE_METADATA,
  RELATIONSHIP_TYPES,
} from "@/config/relationshipMetadata";
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

const DEFAULT_RELATIONSHIP_TYPE: RelationshipType = "Friends";

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

  function getFirstStageKey(relationshipType: RelationshipType) {
    return RELATIONSHIP_STAGE_CONFIG.stagesByType[relationshipType][0]?.stageKey ?? "";
  }

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

        <div className={styles.grid}>
          <label>
            Relationship type
            <select
              {...relationshipTypeRegister}
              onChange={(event) => {
                relationshipTypeRegister.onChange(event);

                const nextType = event.target.value as RelationshipType;
                const nextStageKey = getFirstStageKey(nextType);
                setValue("stageKey", nextStageKey);

                if (inverseTypeLinked) {
                  setValue("inverseRelationshipType", nextType);
                  setValue("inverseStageKey", nextStageKey);
                } else {
                  syncInverseStage(nextType, nextStageKey);
                }
              }}
            >
              {RELATIONSHIP_TYPES.map((relationshipType) => (
                <option key={relationshipType} value={relationshipType}>
                  {relationshipType}
                </option>
              ))}
            </select>
            <span className={styles.helper}>
              {RELATIONSHIP_TYPE_METADATA[selectedType].description}
            </span>
          </label>

          <label>
            Relationship level
            <select
              {...stageKeyRegister}
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
            <strong>{sourceMiiName} → {targetMiiName}</strong>
            <div>
              {selectedType}: {selectedStage.label}
            </div>
          </div>
        ) : null}

        <div className={styles.grid}>
          <label>
            Inverse relationship type
            <select
              {...inverseRelationshipTypeRegister}
              onChange={(event) => {
                inverseRelationshipTypeRegister.onChange(event);

                const nextType = event.target.value as RelationshipType;
                const nextStageKey =
                  nextType === selectedType
                    ? selectedStageKey
                    : getFirstStageKey(nextType);

                setValue("inverseStageKey", nextStageKey);
                setInverseTypeLinked(nextType === selectedType);
                setInverseStageLinked(
                  nextType === selectedType && nextStageKey === selectedStageKey,
                );
              }}
            >
              {RELATIONSHIP_TYPES.map((relationshipType) => (
                <option key={`inverse-${relationshipType}`} value={relationshipType}>
                  {relationshipType}
                </option>
              ))}
            </select>
            <span className={styles.helper}>
              {RELATIONSHIP_TYPE_METADATA[selectedInverseType].description}
            </span>
            <span className={styles.helper}>
              Starts mirrored from the first Mii, but you can change it if the feeling is
              different.
            </span>
          </label>

          <label>
            Inverse relationship level
            <select
              {...inverseStageKeyRegister}
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
            <strong>{targetMiiName} → {sourceMiiName}</strong>
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
          disabled={isSubmitting || miis.length < 2 || availableTargetMiis.length === 0}
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
