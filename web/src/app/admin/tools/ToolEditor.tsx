"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MethodSpec, ToolSnapshot } from "@/lib/tools/interfaces";
import { InputForm } from "@/components/admin/connectors/Field";
import {
  createCustomTool,
  updateCustomTool,
  validateToolDefinition,
} from "@/lib/tools/edit";
import debounce from "lodash/debounce";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
import Link from "next/link";
import { z } from "zod";
import {
  useFieldArray,
  useForm,
  UseFormReturn,
  UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";

function parseJsonWithTrailingCommas(jsonString: string) {
  // Regular expression to remove trailing commas before } or ]
  let cleanedJsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
  // Replace True with true, False with false, and None with null
  cleanedJsonString = cleanedJsonString
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");
  // Now parse the cleaned JSON string
  return JSON.parse(cleanedJsonString);
}

function prettifyDefinition(definition: any) {
  return JSON.stringify(definition, null, 2);
}

function ToolForm({
  existingTool,
  values,
  setFieldValue,
  definitionErrorState,
  methodSpecsState,
  form,
  teamspaceId,
}: {
  existingTool?: ToolSnapshot;
  values: ToolFormValues;
  setFieldValue: UseFormSetValue<FormValues>;
  definitionErrorState: [
    string | null,
    React.Dispatch<React.SetStateAction<string | null>>,
  ];
  methodSpecsState: [
    MethodSpec[] | null,
    React.Dispatch<React.SetStateAction<MethodSpec[] | null>>,
  ];
  form: UseFormReturn<FormValues>;
  teamspaceId?: string | string[];
}) {
  const [definitionError, setDefinitionError] = definitionErrorState;
  const [methodSpecs, setMethodSpecs] = methodSpecsState;
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const debouncedValidateDefinition = useCallback(
    (definition: string) => {
      const validateDefinition = async () => {
        try {
          const parsedDefinition = parseJsonWithTrailingCommas(definition);
          const response = await validateToolDefinition({
            definition: parsedDefinition,
          });
          if (response.error) {
            setMethodSpecs(null);
            setDefinitionError(response.error);
          } else {
            setMethodSpecs(response.data);
            setDefinitionError(null);
          }
        } catch (error) {
          console.log(error);
          setMethodSpecs(null);
          setDefinitionError("Invalid JSON format");
        }
      };

      debounce(validateDefinition, 300)();
    },
    [setMethodSpecs, setDefinitionError]
  );

  useEffect(() => {
    if (values.definition) {
      debouncedValidateDefinition(values.definition);
    }
  }, [values.definition, debouncedValidateDefinition]);

  const onSubmit = async (values: FormValues) => {
    let definition: any;
    try {
      definition = parseJsonWithTrailingCommas(values.definition);
    } catch (error) {
      setDefinitionError("Invalid JSON in tool definition");
      return;
    }

    const name = definition?.info?.title;
    const description = definition?.info?.description;
    const toolData = {
      name: name,
      description: description || "",
      definition: definition,
      custom_headers: values.customHeaders,
    };
    let response;
    if (existingTool) {
      response = await updateCustomTool(existingTool.id, toolData);
    } else {
      response = await createCustomTool(toolData);
    }
    if (response.error) {
      toast({
        title: "Tool Creation Failed",
        description: `Unable to create the tool: ${response.error}`,
        variant: "destructive",
      });
      return;
    }
    router.push(
      teamspaceId
        ? `/t/${teamspaceId}/admin/tools?u=${Date.now()}`
        : `/admin/tools?u=${Date.now()}`
    );
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customHeaders",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative w-full">
        <InputForm
          formControl={form.control}
          name="definition"
          label="Definition"
          description="Specify an OpenAPI schema that defines the APIs you want to make available as part of this tool."
          placeholder="Enter your OpenAPI schema here"
          className="min-h-96 max-h-[1000px] text-sm"
          isTextarea
        />
        <Button
          type="button"
          className="absolute bottom-8 right-4"
          onClick={() => {
            const definition = values.definition;
            if (definition) {
              try {
                const formatted = prettifyDefinition(
                  parseJsonWithTrailingCommas(definition)
                );
                setFieldValue("definition", formatted);
                toast({
                  title: "Definition formatted",
                  description:
                    "The definition has been successfully formatted.",
                  variant: "success",
                });
              } catch (error) {
                toast({
                  title: "Invalid JSON format",
                  description: "Please check the JSON syntax and try again.",
                  variant: "destructive",
                });
              }
            }
          }}
          variant="outline"
        >
          Format
        </Button>
      </div>
      {definitionError && (
        <div className="text-sm text-error">{definitionError}</div>
      )}
      <div className="p-4 mt-4 text-sm border border-blue-200 rounded-md bg-blue-50">
        <Link
          href="#"
          className="flex items-center text-link hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Learn more about tool calling in our documentation
        </Link>
      </div>

      {methodSpecs && methodSpecs.length > 0 && (
        <div className="pt-4">
          <h3 className="pb-2">Available methods</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methodSpecs?.map((method: MethodSpec, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{method.name}</TableCell>
                      <TableCell>{method.summary}</TableCell>
                      <TableCell>{method.method.toUpperCase()}</TableCell>
                      <TableCell>{method.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <AdvancedOptionsToggle
        showAdvancedOptions={showAdvancedOptions}
        setShowAdvancedOptions={setShowAdvancedOptions}
      />
      {showAdvancedOptions && (
        <div className="pt-4">
          <div>
            <div className="flex justify-between pb-4">
              <div>
                <h3 className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1">
                  Custom Headers
                </h3>
                <p className="text-sm text-muted-foreground">
                  Specify custom headers for each request to this tool&apos;s
                  API.
                </p>
              </div>

              <Button
                onClick={() => append({ key: "", value: "" })}
                variant="outline"
                type="button"
              >
                <Plus size={16} /> Add New Header
              </Button>
            </div>

            <div className="space-y-4">
              {fields && fields.length > 0 && (
                <div className="space-y-3">
                  {fields.map((header, index) => (
                    <div
                      key={header.id}
                      className="flex items-start p-3 space-x-2 rounded-lg shadow-sm bg-background-weak w-full"
                    >
                      <InputForm
                        formControl={form.control}
                        name={`customHeaders.${index}.key`}
                        placeholder="Header Key"
                        fullWidth
                      />

                      <InputForm
                        formControl={form.control}
                        name={`customHeaders.${index}.value`}
                        placeholder="Header Value"
                        fullWidth
                      />
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-8">
        <Button
          className="mx-auto"
          type="submit"
          disabled={form.formState.isSubmitting || !!definitionError}
        >
          {existingTool ? "Update Tool" : "Create Tool"}
        </Button>
      </div>
    </form>
  );
}

interface ToolFormValues {
  definition: string;
  customHeaders: { key: string; value: string }[];
}

const formSchema = z.object({
  definition: z.string().min(1, { message: "Tool definition is required" }),
  customHeaders: z
    .array(
      z.object({
        key: z.string().min(1, { message: "Header key is required" }),
        value: z.string().min(1, { message: "Header value is required" }),
      })
    )
    .default([]),
});

type FormValues = z.infer<typeof formSchema>;

export function ToolEditor({
  tool,
  teamspaceId,
}: {
  tool?: ToolSnapshot;
  teamspaceId?: string | string[];
}) {
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [methodSpecs, setMethodSpecs] = useState<MethodSpec[] | null>(null);

  const prettifiedDefinition = tool?.definition
    ? prettifyDefinition(tool.definition)
    : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      definition: prettifiedDefinition,
      customHeaders: tool?.custom_headers?.map((header) => ({
        key: header.key,
        value: header.value,
      })) ?? [{ key: "test", value: "value" }],
    },
  });

  const values = form.getValues();

  return (
    <Form {...form}>
      <ToolForm
        existingTool={tool}
        values={values}
        setFieldValue={form.setValue}
        definitionErrorState={[definitionError, setDefinitionError]}
        methodSpecsState={[methodSpecs, setMethodSpecs]}
        form={form}
        teamspaceId={teamspaceId}
      />
    </Form>
  );
}
