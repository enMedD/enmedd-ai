"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Scope } from "./types";
import { Teamspace } from "@/lib/types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Combobox } from "@/components/Combobox";

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
  const { toast } = useToast();
  const [modalTeamspaces, setModalTeamspaces] = useState<Teamspace[]>([]);
  const [shouldFetchTeamspaces, setShouldFetchTeamspaces] = useState(
    forSpecificScope === Scope.TEAMSPACE
  );

  useEffect(() => {
    const fetchTeamspaces = async () => {
      try {
        const response = await fetch("/api/manage/admin/teamspace");
        const data = await response.json();
        setModalTeamspaces(
          data.map((teamspace: Teamspace) => ({
            id: teamspace.id,
            name: teamspace.name,
          }))
        );
        setShouldFetchTeamspaces(false);
      } catch (error) {
        toast({
          title: "Fetch Failed",
          description: `Unable to retrieve user teamspaces. Reason: ${error}`,
          variant: "destructive",
        });
      }
    };

    if (shouldFetchTeamspaces) fetchTeamspaces();
  }, [shouldFetchTeamspaces, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_scope: forSpecificScope || Scope.GLOBAL,
      teamspace_id: forSpecificTeamspace,
      period_hours: undefined,
      token_budget: undefined,
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(
      values.target_scope,
      values.period_hours,
      values.token_budget,
      values.teamspace_id ?? 0
    );
    setIsOpen(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {!forSpecificScope && (
          <FormField
            control={form.control}
            name="target_scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Scope</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value as Scope);
                      if (value === Scope.TEAMSPACE) {
                        setShouldFetchTeamspaces(true);
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Scope.GLOBAL}>Global</SelectItem>
                      <SelectItem value={Scope.USER}>User</SelectItem>
                      <SelectItem value={Scope.TEAMSPACE}>Teamspace</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="w-full relative">
          {forSpecificTeamspace === undefined &&
            form.watch("target_scope") === Scope.TEAMSPACE && (
              <FormField
                control={form.control}
                name="teamspace_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teamspace</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Teamspace" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[500px]">
                          {modalTeamspaces.map((teamspace) => (
                            <SelectItem
                              key={teamspace.id}
                              value={teamspace.id.toString()}
                              className="max-w-[500px]"
                            >
                              {teamspace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* <Combobox
                        items={modalTeamspaces.map((teamspace) => ({
                          value: teamspace.id.toString(),
                          label: teamspace.name,
                        }))}
                        onSelect={(selectedValues) => {
                          const selectedIds = selectedValues.map((value) =>
                            parseInt(value, 10)
                          );
                          field.onChange(selectedIds);
                        }}
                        placeholder="Select data source"
                        label="Select data source"
                        selected={
                          Array.isArray(field.value)
                            ? field.value.map((id) => id.toString())
                            : []
                        }
                        isOnModal
                      /> */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
        </div>

        <FormField
          control={form.control}
          name="period_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Window (Hours)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter time in hours"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(Number(e.target.value) || "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="token_budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Budget (Thousands)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter token budget"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(Number(e.target.value) || "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
