"use client";

import { ArrayHelpers, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import { createDocumentSet, updateDocumentSet } from "./lib";
import { ConnectorIndexingStatus, DocumentSet, Teamspace } from "@/lib/types";
import {
  BooleanFormField,
  TextFormField,
} from "@/components/admin/connectors/Field";
import { ConnectorTitle } from "@/components/admin/connectors/ConnectorTitle";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { Divider } from "@/components/Divider";
import { Combobox } from "@/components/Combobox";

interface SetCreationPopupProps {
  ccPairs: ConnectorIndexingStatus<any, any>[];
  teamspaces: Teamspace[] | undefined;
  onClose: () => void;
  existingDocumentSet?: DocumentSet;
}

export const DocumentSetCreationForm = ({
  ccPairs,
  teamspaces,
  onClose,
  existingDocumentSet,
}: SetCreationPopupProps) => {
  const { toast } = useToast();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  const isUpdate = existingDocumentSet !== undefined;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCcPairs = ccPairs.filter((ccPair) =>
    ccPair.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const connectorItems = filteredCcPairs.map((ccPair) => ({
    value: ccPair.cc_pair_id.toString(),
    label: ccPair.name || `Connector ${ccPair.cc_pair_id}`,
  }));

  return (
    <div>
      <Formik
        initialValues={{
          name: existingDocumentSet ? existingDocumentSet.name : "",
          description: existingDocumentSet
            ? existingDocumentSet.description
            : "",
          cc_pair_ids: existingDocumentSet
            ? existingDocumentSet.cc_pair_descriptors.map(
                (ccPairDescriptor) => {
                  return ccPairDescriptor.id;
                }
              )
            : ([] as number[]),
          is_public: existingDocumentSet ? existingDocumentSet.is_public : true,
          users: existingDocumentSet ? existingDocumentSet.users : [],
          groups: existingDocumentSet ? existingDocumentSet.groups : [],
        }}
        validationSchema={Yup.object().shape({
          name: Yup.string().required("Please enter a name for the set"),
          description: Yup.string().required(
            "Please enter a description for the set"
          ),
          cc_pair_ids: Yup.array()
            .of(Yup.number().required())
            .required("Please select at least one connector"),
        })}
        onSubmit={async (values, formikHelpers) => {
          formikHelpers.setSubmitting(true);
          // If the document set is public, then we don't want to send any groups
          const processedValues = {
            ...values,
            groups: values.is_public ? [] : values.groups,
          };

          let response;
          if (isUpdate) {
            response = await updateDocumentSet({
              id: existingDocumentSet.id,
              ...processedValues,
            });
          } else {
            response = await createDocumentSet(processedValues);
          }
          formikHelpers.setSubmitting(false);
          if (response.ok) {
            toast({
              title: isUpdate
                ? "Document Set Updated"
                : "New Document Set Created",
              description: isUpdate
                ? "Your document set has been updated successfully."
                : "Your new document set has been created successfully.",
              variant: "success",
            });
            onClose();
          } else {
            const errorMsg = await response.text();
            toast({
              title: "Action Failed",
              description: isUpdate
                ? `Failed to update document set: ${errorMsg}`
                : `Failed to create document set: ${errorMsg}`,
              variant: "destructive",
            });
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form>
            <TextFormField
              name="name"
              label="Name:"
              placeholder="A name for the document set"
              disabled={isUpdate}
              autoCompleteDisabled={true}
            />
            <TextFormField
              name="description"
              label="Description:"
              placeholder="Describe what the document set represents"
              autoCompleteDisabled={true}
            />

            <Divider />

            <div>
              <h3 className="mb-1 text-sm">Pick your connectors:</h3>
              <Combobox
                items={connectorItems}
                onSelect={(selectedValues) => {
                  const selectedIds = selectedValues.map((val) =>
                    parseInt(val, 10)
                  );
                  setFieldValue("cc_pair_ids", selectedIds);
                }}
                placeholder="Search connectors"
                label="Select connectors"
              />
            </div>

            {teamspaces && teamspaces.length > 0 && (
              <div>
                <Divider />

                <BooleanFormField
                  name="is_public"
                  label="Is Public?"
                  subtext={
                    <>
                      If the document set is public, then it will be visible to{" "}
                      <b>all users</b>. If it is not public, then only users in
                      the specified teamspace will be able to see it.
                    </>
                  }
                />

                <Divider />
                <h3 className="mb-1 text-sm">Teamspace with Access</h3>
                {!values.is_public ? (
                  <>
                    <p className="mb-2 text-subtle text-xs ">
                      If any teamspace are specified, then this Document Set
                      will only be visible to the specified teamspace. If no
                      teamspace are specified, then the Document Set will be
                      visible to all users.
                    </p>
                    <Combobox
                      items={teamspaces.map((teamspace) => ({
                        value: teamspace.id.toString(),
                        label: teamspace.name,
                      }))}
                      onSelect={(selectedTeamspaceIds) => {
                        const selectedIds = selectedTeamspaceIds.map((val) =>
                          parseInt(val, 10)
                        );
                        setFieldValue("groups", selectedIds);
                      }}
                      placeholder="Select teamspaces"
                      label="Teamspaces"
                    />
                  </>
                ) : (
                  <p className="text-sm text-subtle">
                    This Document Set is public, so this does not apply. If you
                    want to control which teamspace see this Document Set, mark
                    it as non-public!
                  </p>
                )}
              </div>
            )}
            <div className="flex mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-64 mx-auto"
              >
                {isUpdate ? "Update" : "Create"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
