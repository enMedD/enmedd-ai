import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import React, { useState, useEffect } from "react";
import { FormikProps, FieldArray, ArrayHelpers, ErrorMessage } from "formik";
import { Text, Divider } from "@tremor/react";
import { FiUsers } from "react-icons/fi";
import { Teamspace, UserRole } from "@/lib/types";
import { useTeamspaces } from "@/lib/hooks";
import { BooleanFormField } from "@/components/admin/connectors/Field";
import { useUser } from "./user/UserProvider";

export type IsPublicGroupSelectorFormType = {
  is_public: boolean;
  teamspaces: number[];
};

// This should be included for all forms that require teamspaces / public access
// to be set, and access to this / permissioning should be handled within this component itself.
export const IsPublicGroupSelector = <T extends IsPublicGroupSelectorFormType>({
  formikProps,
  objectName,
  publicToWhom = "Users",
  removeIndent = false,
  enforceGroupSelection = true,
}: {
  formikProps: FormikProps<T>;
  objectName: string;
  publicToWhom?: string;
  removeIndent?: boolean;
  enforceGroupSelection?: boolean;
}) => {
  const { data: Teamspaces, isLoading: TeamspacesIsLoading } = useTeamspaces();
  const { isAdmin, user, isLoadingUser, isCurator } = useUser();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();
  const [shouldHideContent, setShouldHideContent] = useState(false);

  useEffect(() => {
    if (user && Teamspaces && isPaidEnterpriseFeaturesEnabled) {
      const isUserAdmin = user.role === UserRole.ADMIN;
      if (!isUserAdmin) {
        formikProps.setFieldValue("is_public", false);
      }
      if (Teamspaces.length === 1 && !isUserAdmin) {
        formikProps.setFieldValue("teamspaces", [Teamspaces[0].id]);
        setShouldHideContent(true);
      } else if (formikProps.values.is_public) {
        formikProps.setFieldValue("teamspaces", []);
        setShouldHideContent(false);
      } else {
        setShouldHideContent(false);
      }
    }
  }, [user, Teamspaces, isPaidEnterpriseFeaturesEnabled]);

  if (isLoadingUser || TeamspacesIsLoading) {
    return <div>Loading...</div>;
  }
  if (!isPaidEnterpriseFeaturesEnabled) {
    return null;
  }

  if (shouldHideContent && enforceGroupSelection) {
    return (
      <>
        {Teamspaces && (
          <div className="mb-1 font-medium text-base">
            This {objectName} will be assigned to teamspace{" "}
            <b>{Teamspaces[0].name}</b>.
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <Divider />
      {isAdmin && (
        <>
          <BooleanFormField
            name="is_public"
            removeIndent={removeIndent}
            label={
              publicToWhom === "Curators"
                ? `Make this ${objectName} Curator Accessible?`
                : `Make this ${objectName} Public?`
            }
            disabled={!isAdmin}
            subtext={
              <span className="block mt-2 text-sm text-gray-500">
                If set, then this {objectName} will be usable by{" "}
                <b>All {publicToWhom}</b>. Otherwise, only <b>Admins</b> and{" "}
                <b>{publicToWhom}</b> who have explicitly been given access to
                this {objectName} (e.g. via a Teamspacep) will have access.
              </span>
            }
          />
        </>
      )}

      {(!formikProps.values.is_public || isCurator) &&
        Teamspaces &&
        Teamspaces?.length > 0 && (
          <>
            <div className="flex mt-4 gap-x-2 items-center">
              <div className="block font-medium text-base">
                Assign teamspace access for this {objectName}
              </div>
            </div>
            {TeamspacesIsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            ) : (
              <Text className="mb-3">
                {isAdmin || !enforceGroupSelection ? (
                  <>
                    This {objectName} will be visible/accessible by the
                    teamspaces selected below
                  </>
                ) : (
                  <>
                    Curators must select one or more teamspaces to give access
                    to this {objectName}
                  </>
                )}
              </Text>
            )}
            <FieldArray
              name="teamspaces"
              render={(arrayHelpers: ArrayHelpers) => (
                <div className="flex gap-2 flex-wrap mb-4">
                  {TeamspacesIsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                  ) : (
                    Teamspaces &&
                    Teamspaces.map((Teamspace: Teamspace) => {
                      const ind = formikProps.values.teamspaces.indexOf(
                        Teamspace.id
                      );
                      let isSelected = ind !== -1;
                      return (
                        <div
                          key={Teamspace.id}
                          className={`
                        px-3 
                        py-1
                        rounded-lg 
                        border
                        border-border 
                        w-fit 
                        flex 
                        cursor-pointer 
                        ${isSelected ? "bg-background-strong" : "hover:bg-hover"}
                      `}
                          onClick={() => {
                            if (isSelected) {
                              arrayHelpers.remove(ind);
                            } else {
                              arrayHelpers.push(Teamspace.id);
                            }
                          }}
                        >
                          <div className="my-auto flex">
                            <FiUsers className="my-auto mr-2" />{" "}
                            {Teamspace.name}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            />
            <ErrorMessage
              name="teamspaces"
              component="div"
              className="text-error text-sm mt-1"
            />
          </>
        )}
    </div>
  );
};
