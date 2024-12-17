"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Scope } from "./types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputForm, SelectForm } from "@/components/admin/connectors/Field";
import { useTeamspaces } from "@/lib/hooks";
import { useEffect } from "react";

interface CreateRateLimitModalProps {
  onSubmit: (
    target_scope: Scope,
    period_hours: number,
    token_budget: number,
    team_id: number
  ) => void;
  forSpecificScope?: Scope;
  forSpecificTeamspace?: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

const schema = z.object({
  target_scope: z.nativeEnum(Scope),
  teamspace_id: z.number().optional(),
  period_hours: z
    .number()
    .min(1, { message: "Time Window must be at least 1 hour" }),
  token_budget: z
    .number()
    .min(1, { message: "Token Budget must be at least 1" }),
});

type FormValues = z.infer<typeof schema>;

export const CreateRateLimitModal = ({
  onSubmit,
  forSpecificScope,
  forSpecificTeamspace,
  isOpen,
  setIsOpen,
  onClose,
}: CreateRateLimitModalProps) => {
  const { data: teamspaces, isLoading: teamspacesIsLoading } = useTeamspaces();

  const cachedFormData = JSON.parse(
    localStorage.getItem("tokenRateFormData") || "{}"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_scope:
        forSpecificScope || cachedFormData.target_scope || Scope.GLOBAL,
      teamspace_id: forSpecificTeamspace || cachedFormData.teamspace_id,
      period_hours: cachedFormData.period_hours ?? undefined,
      token_budget: cachedFormData.token_budget ?? undefined,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("tokenRateFormData", JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(
      values.target_scope,
      values.period_hours,
      values.token_budget,
      values.teamspace_id ?? 0
    );
    setIsOpen(false);
  };

  const teamspaceData =
    teamspaces?.map((teamspace) => ({
      value: teamspace.id.toString(),
      label: teamspace.name || `Teamspace ${teamspace.id}`,
    })) ?? [];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {!forSpecificScope && (
          <SelectForm
            formControl={form.control}
            name="target_scope"
            label="Target Scope"
            placeholder="Select Scope"
            options={[
              { value: Scope.GLOBAL, label: "Global" },
              { value: Scope.USER, label: "User" },
              { value: Scope.TEAMSPACE, label: "Teamspace" },
            ]}
          />
        )}

        {forSpecificTeamspace === undefined &&
          form.watch("target_scope") === Scope.TEAMSPACE && (
            <SelectForm
              formControl={form.control}
              name="teamspace_id"
              label="Teamspace"
              placeholder="Select Teamspace"
              options={teamspaceData}
              valueType="number"
            />
          )}

        <InputForm
          formControl={form.control}
          name="period_hours"
          label="Time Window (Hours)"
          placeholder="Enter time in hours"
          type="number"
        />

        <InputForm
          formControl={form.control}
          name="token_budget"
          label="Token Budget (Thousands)"
          placeholder="Enter token budget"
          type="number"
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </Form>
  );
};
