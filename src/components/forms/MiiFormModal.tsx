import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PERSONALITY_GROUPS } from "@/config/personalities";
import { miiFormSchema } from "@/lib/schemas";
import type { Mii, MiiInput } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import styles from "./FormLayout.module.css";

type MiiFormValues = z.infer<typeof miiFormSchema>;

interface MiiFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValue?: Mii;
  onClose(): void;
  onSubmit(input: MiiInput): Promise<void>;
}

export function MiiFormModal({
  open,
  mode,
  initialValue,
  onClose,
  onSubmit,
}: MiiFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MiiFormValues>({
    resolver: zodResolver(miiFormSchema),
    defaultValues: initialValue
      ? {
          name: initialValue.name,
          personalityType: initialValue.personalityType,
          level: initialValue.level,
        }
      : {
          name: "",
          personalityType: PERSONALITY_GROUPS[0].types[0],
          level: 1,
        },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      initialValue
        ? {
            name: initialValue.name,
            personalityType: initialValue.personalityType,
            level: initialValue.level,
          }
        : {
            name: "",
            personalityType: PERSONALITY_GROUPS[0].types[0],
            level: 1,
          },
    );
  }, [initialValue, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add a new Mii" : `Edit ${initialValue?.name ?? "Mii"}`}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values as MiiInput);
          onClose();
        })}
      >
        <label>
          Name
          <input {...register("name")} placeholder="Princess Peach" />
          {errors.name ? <span className={styles.error}>{errors.name.message}</span> : null}
        </label>

        <div className={styles.grid}>
          <label>
            Personality type
            <select {...register("personalityType")}>
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
            {errors.personalityType ? (
              <span className={styles.error}>{errors.personalityType.message}</span>
            ) : null}
          </label>

          <label>
            Current level
            <input {...register("level")} type="number" min={1} max={999} />
            {errors.level ? <span className={styles.error}>{errors.level.message}</span> : null}
          </label>
        </div>

        <p className={styles.helper}>
          Personalities use the 16 North American labels from Tomodachi Life: Living the
          Dream.
        </p>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Mii"
              : "Save changes"}
        </Button>
      </form>
    </Modal>
  );
}
