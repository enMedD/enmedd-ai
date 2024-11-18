// "use client";

// import { useRouter } from "next/navigation";
// import { Workspaces } from "@/app/admin/settings/interfaces";
// import { useContext, useState } from "react";
// import { SettingsContext } from "@/components/settings/SettingsProvider";
// import { Form, Formik } from "formik";
// import * as Yup from "yup";
// import {
//   BooleanFormField,
//   SubLabel,
//   TextFormField,
// } from "@/components/admin/connectors/Field";
// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import Link from "next/link";
// import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
// import { Text } from "@tremor/react";
// import { useToast } from "@/hooks/use-toast";
// import { ImageUpload } from "../ImageUpload";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";

// export default function General() {
//   const settings = useContext(SettingsContext);
//   if (!settings) {
//     return null;
//   }
//   const workspaces = settings.workspaces;
//   const { toast } = useToast();
//   const router = useRouter();
//   const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
//   const [selectedHeaderLogo, setSelectedHeaderLogo] = useState<File | null>(
//     null
//   );
//   const [selectedLogotype, setSelectedLogotype] = useState<File | null>(null);
//   const [formData, setFormData] = useState({
//     smtp_server: settings.settings.smtp_server,
//     smtp_port: settings.settings.smtp_port,
//     smtp_username: settings.settings.smtp_username,
//     smtp_password: settings.settings.smtp_password,
//   });
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

//   async function updateWorkspaces(newValues: Workspaces) {
//     const response = await fetch("/api/admin/workspace", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         ...(workspaces || {}),
//         ...newValues,
//       }),
//     });
//     if (response.ok) {
//       router.refresh();
//       toast({
//         title: "Settings updated",
//         description: "The workspace settings have been successfully updated.",
//         variant: "success",
//       });
//     } else {
//       const errorMsg = (await response.json()).detail;
//       toast({
//         title: "Failed to update settings.",
//         description: errorMsg,
//         variant: "destructive",
//       });
//     }
//   }

//   async function updateSmtpSettings(workspaceId: number, smtpSettings: any) {
//     setLoading(true);
//     const response = await fetch(
//       `/api/admin/settings/workspace/${workspaceId}/smtp`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(smtpSettings),
//       }
//     );

//     setLoading(false);
//     if (response.ok) {
//       toast({
//         title: "SMTP Settings Updated",
//         description: "The SMTP settings have been successfully updated.",
//         variant: "success",
//       });
//     } else {
//       const errorMsg = (await response.json()).detail;
//       toast({
//         title: "Failed to update SMTP settings.",
//         description: errorMsg,
//         variant: "destructive",
//       });
//     }
//   }

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: name === "smtp_port" ? parseInt(value, 10) : value,
//     }));
//   };

//   return (
//     <div className="pt-6">
//       <Formik
//         initialValues={{
//           workspace_name: workspaces?.workspace_name || null,
//           workspace_description: workspaces?.workspace_description || null,
//           use_custom_logo: workspaces?.use_custom_logo || false,
//           use_custom_logotype: workspaces?.use_custom_logotype || false,
//           custom_header_logo: workspaces?.custom_header_logo || "",
//           custom_header_content: workspaces?.custom_header_content || "",
//           two_lines_for_chat_header:
//             workspaces?.two_lines_for_chat_header || false,
//           custom_popup_header: workspaces?.custom_popup_header || "",
//           custom_popup_content: workspaces?.custom_popup_content || "",
//           custom_lower_disclaimer_content:
//             workspaces?.custom_lower_disclaimer_content || "",
//           custom_nav_items: workspaces?.custom_nav_items || [],
//           enable_consent_screen: workspaces?.enable_consent_screen || false,
//           brand_color: workspaces?.brand_color || "",
//         }}
//         validationSchema={Yup.object().shape({
//           workspace_name: Yup.string().nullable(),
//           workspace_description: Yup.string().nullable(),
//           use_custom_logo: Yup.boolean().required(),
//           custom_header_logo: Yup.string().nullable(),
//           use_custom_logotype: Yup.boolean().required(),
//           custom_header_content: Yup.string().nullable(),
//           two_lines_for_chat_header: Yup.boolean().nullable(),
//           custom_popup_header: Yup.string().nullable(),
//           custom_popup_content: Yup.string().nullable(),
//           custom_lower_disclaimer_content: Yup.string().nullable(),
//           enable_consent_screen: Yup.boolean().nullable(),
//         })}
//         onSubmit={async (values, formikHelpers) => {
//           formikHelpers.setSubmitting(true);

//           if (selectedLogo) {
//             values.use_custom_logo = true;

//             const formData = new FormData();
//             formData.append("file", selectedLogo);
//             setSelectedLogo(null);
//             const response = await fetch("/api/admin/workspace/logo", {
//               method: "PUT",
//               body: formData,
//             });
//             if (!response.ok) {
//               const errorMsg = (await response.json()).detail;
//               toast({
//                 title: "Failed to upload logo",
//                 description: `Error: ${errorMsg}`,
//                 variant: "destructive",
//               });
//               formikHelpers.setSubmitting(false);
//               return;
//             }
//           }

//           if (selectedHeaderLogo) {
//             const formData = new FormData();
//             formData.append("file", selectedHeaderLogo);
//             setSelectedHeaderLogo(null);

//             const response = await fetch("/api/admin/workspace/header-logo", {
//               method: "PUT",
//               body: formData,
//             });

//             if (response.ok) {
//               const responseData = await response.json();
//               values.custom_header_logo = responseData.file_path;
//               toast({
//                 title: "Header logo uploaded",
//                 description: "The header logo has been successfully uploaded.",
//                 variant: "success",
//               });
//             } else {
//               const errorMsg = (await response.json()).detail;
//               toast({
//                 title: "Failed to upload header logo",
//                 description: `Error: ${errorMsg}`,
//                 variant: "destructive",
//               });
//               formikHelpers.setSubmitting(false);
//               return;
//             }
//           }

//           if (selectedLogotype) {
//             values.use_custom_logotype = true;

//             const formData = new FormData();
//             formData.append("file", selectedLogotype);
//             setSelectedLogotype(null);
//             const response = await fetch(
//               "/api/admin/workspace/logo?is_logotype=true",
//               {
//                 method: "PUT",
//                 body: formData,
//               }
//             );
//             if (!response.ok) {
//               const errorMsg = (await response.json()).detail;
//               alert(`Failed to upload logo. ${errorMsg}`);
//               formikHelpers.setSubmitting(false);
//               return;
//             }
//           }

//           formikHelpers.setValues(values);
//           await updateWorkspaces(values);

//           toast({
//             title: "Updated Successfully",
//             description: "Workspace successfully updated.",
//             variant: "success",
//           });
//         }}
//       >
//         {({ isSubmitting, values, setValues, setFieldValue }) => (
//           <Form>
//             <div className="py-8 border-b">
//               <div className="flex gap-5 flex-col md:flex-row">
//                 <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                   <Label
//                     htmlFor="workspace_name"
//                     className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                   >
//                     Workspace Name
//                   </Label>
//                   <p className="text-sm text-muted-foreground pb-1.5">
//                     The custom name you are giving for your workspace. This will
//                     replace 'Arnold AI' everywhere in the UI.
//                   </p>
//                 </div>

//                 <div className="md:w-[500px]">
//                   <Input
//                     name="workspace_name"
//                     value={values.workspace_name || ""}
//                     onChange={(e) =>
//                       setFieldValue("workspace_name", e.target.value)
//                     }
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="py-8 border-b">
//               <div className="flex gap-5 flex-col md:flex-row">
//                 <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                   <Label
//                     htmlFor="workspace_description"
//                     className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                   >
//                     Description
//                   </Label>
//                   <p className="text-sm text-muted-foreground pb-1.5">
//                     {`The custom description metadata you are giving ${
//                       values.workspace_name || "Arnold AI"
//                     } for your workspace.\
//                   This will be seen when sharing the link or searching through the browser.`}
//                   </p>
//                 </div>

//                 <div className="md:w-[500px]">
//                   <Input
//                     name="workspace_description"
//                     placeholder="Custom description for your Workspace"
//                     value={values.workspace_description || ""}
//                     onChange={(e) =>
//                       setFieldValue("workspace_description", e.target.value)
//                     }
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="py-8 border-b">
//               <div className="flex gap-5 flex-col md:flex-row">
//                 <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                   <Label
//                     htmlFor="custom_logo"
//                     className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                   >
//                     Logo
//                   </Label>
//                   <p className="text-sm text-muted-foreground pb-1.5">
//                     Specify your own logo to replace the standard Arnold AI
//                     logo.
//                   </p>
//                 </div>

//                 <div className="md:w-[500px]">
//                   <ImageUpload
//                     selectedFile={selectedLogo}
//                     setSelectedFile={setSelectedLogo}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="py-8 border-b">
//               <div className="flex gap-5 flex-col md:flex-row">
//                 <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                   <Label
//                     htmlFor="custom_logo"
//                     className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                   >
//                     Header Logo
//                   </Label>
//                   <p className="text-sm text-muted-foreground pb-1.5">
//                     Specify your own header logo to replace the standard Arnold
//                     AI header logo.
//                   </p>
//                 </div>

//                 <div className="md:w-[500px]">
//                   <ImageUpload
//                     selectedFile={selectedHeaderLogo}
//                     setSelectedFile={setSelectedHeaderLogo}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="py-8 border-b">
//               <div className="flex gap-5 flex-col md:flex-row">
//                 <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                   <Label
//                     htmlFor="workspace_description"
//                     className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                   >
//                     Brand Theme
//                   </Label>
//                   <p className="text-sm text-muted-foreground pb-1.5">
//                     Select your customize brand color.
//                   </p>
//                 </div>

//                 <div className="md:w-[500px]">
//                   <div className="flex items-center gap-4">
//                     <span className="text-sm text-subtle">Custom color:</span>
//                     <TextFormField
//                       name="brand_color"
//                       width="w-32"
//                       optional
//                       noPadding
//                     />

//                     <div className="flex gap-2">
//                       {workspaces?.brand_color && (
//                         <div
//                           className="w-10 h-10 rounded-full border-white border-2 cursor-pointer shrink-0"
//                           style={{
//                             background: workspaces?.brand_color,
//                             outline: `1px solid ${workspaces?.brand_color}`,
//                           }}
//                         />
//                       )}
//                       <div className="w-10 h-10 bg-brand-500 rounded-full outline-brand-500 outline-1 outline border-white border-2 cursor-pointer shrink-0" />
//                       <div className="w-10 h-10 bg-background-inverted rounded-full outline-background-ibg-background-inverted outline-1 outline border-white border-2 cursor-pointer shrink-0" />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end">
//               <Button type="submit">Update</Button>
//             </div>

//             <div className="pt-20">
//               {/* <div className="py-8 border-b">
//                 <div className="flex gap-5 flex-col md:flex-row">
//                   <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                     <Label
//                       htmlFor="workspace_description"
//                       className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                     >
//                       Custom Domain
//                     </Label>
//                     <p className="text-sm text-muted-foreground pb-1.5">
//                       Custom domains allow you to serve your site from a domain
//                     </p>
//                   </div>

//                   <div className="flex md:w-[500px]">
//                     <TextFormField
//                       name="custom_domain"
//                       placeholder="Enter custom domain"
//                       width="w-full"
//                       //remove this
//                       optional
//                     />
//                     <div className="flex gap-2">
//                       <Button variant="ghost">Cancel</Button>
//                       <Button>Save</Button>
//                     </div>
//                   </div>
//                 </div>
//               </div> */}

//               <div className="py-8 border-b">
//                 <div className="flex gap-5 flex-col md:flex-row">
//                   <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
//                     <Label
//                       htmlFor="workspace_description"
//                       className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
//                     >
//                       SMTP
//                     </Label>
//                     <p className="text-sm text-muted-foreground pb-1.5">
//                       Enables the exchange of emails between servers.
//                     </p>
//                   </div>

//                   <div className="md:w-[500px]">
//                     <div className="flex flex-col items-end">
//                       <div className="w-full flex flex-col gap-4">
//                         {isEditing ? (
//                           <>
//                             <TextFormField
//                               name="smtp_server"
//                               label="SMTP Server"
//                               placeholder="Enter hostname"
//                               //remove this
//                               optional
//                               value={formData.smtp_server}
//                               onChange={handleChange}
//                             />

//                             <TextFormField
//                               name="smtp_port"
//                               label="SMTP Port"
//                               placeholder="Enter port"
//                               optional
//                               type="text"
//                               value={formData.smtp_port.toString()}
//                               onChange={handleChange}
//                             />

//                             <TextFormField
//                               name="smtp_username"
//                               label="SMTP Username (email)"
//                               placeholder="Enter username"
//                               //remove this
//                               optional
//                               value={formData.smtp_username}
//                               onChange={handleChange}
//                             />

//                             <TextFormField
//                               name="smtp_password"
//                               label="SMTP Password"
//                               placeholder="Enter password"
//                               //remove this
//                               optional
//                               type="password"
//                               value={formData.smtp_password}
//                               onChange={handleChange}
//                             />
//                           </>
//                         ) : (
//                           <>
//                             <div className="flex gap-6">
//                               <span className="whitespace-nowrap">
//                                 SMTP Server:
//                               </span>
//                               <span className="font-semibold text-inverted-inverted w-full truncate">
//                                 {settings.settings.smtp_server || "None"}
//                               </span>
//                             </div>

//                             <div className="flex gap-6">
//                               <span className="whitespace-nowrap">
//                                 SMTP Port:
//                               </span>
//                               <span className="font-semibold text-inverted-inverted w-full truncate">
//                                 {settings.settings.smtp_port}
//                               </span>
//                             </div>

//                             <div className="flex gap-6">
//                               <span className="whitespace-nowrap">
//                                 SMTP Username (email):
//                               </span>
//                               <span className="font-semibold text-inverted-inverted w-full truncate">
//                                 {settings.settings.smtp_username || "None"}
//                               </span>
//                             </div>

//                             <div className="flex gap-6">
//                               <span className="whitespace-nowrap">
//                                 SMTP Password:
//                               </span>
//                               <span className="font-semibold text-inverted-inverted truncate">
//                                 &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
//                               </span>
//                             </div>
//                           </>
//                         )}

//                         <div className="flex justify-end">
//                           {isEditing ? (
//                             <div className="flex gap-2">
//                               <Button
//                                 variant="ghost"
//                                 type="button"
//                                 onClick={() => setIsEditing(false)}
//                                 disabled={loading}
//                               >
//                                 Cancel
//                               </Button>
//                               <Button
//                                 type="button"
//                                 onClick={async () => {
//                                   await updateSmtpSettings(0, formData);
//                                   setFormData({
//                                     smtp_server: "",
//                                     smtp_port: 0,
//                                     smtp_username: "",
//                                     smtp_password: "",
//                                   });
//                                   setIsEditing(false);
//                                 }}
//                                 disabled={loading}
//                               >
//                                 Save
//                               </Button>
//                             </div>
//                           ) : (
//                             <Button
//                               onClick={() => setIsEditing(true)}
//                               type="button"
//                             >
//                               Edit
//                             </Button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* <div>
//               {values.use_custom_logo ? (
//                 <div className="pt-3 flex flex-col items-start gap-3">
//                   <div>
//                     <h3>Custom Logo</h3>
//                     <SubLabel>Current Custom Logo: </SubLabel>
//                   </div>
//                   <img
//                     src={"/api/workspace/logo?workspace_id=" + 0} //temporary id for workspace
//                     alt="Logo"
//                     style={{ objectFit: "contain" }}
//                     className="w-32 h-32"
//                   />

//                   <Button
//                     variant="destructive"
//                     type="button"
//                     onClick={async () => {
//                       const valuesWithoutLogo = {
//                         ...values,
//                         use_custom_logo: false,
//                       };
//                       await updateWorkspaces(valuesWithoutLogo);
//                       setValues(valuesWithoutLogo);
//                     }}
//                   >
//                     Delete
//                   </Button>

//                   <p className="text-sm text-subtle pt-4 pb-2">
//                     Override the current custom logo by uploading a new image
//                     below and clicking the Update button.
//                   </p>
//                 </div>
//               ) : (
//                 <p className="pb-3 text-sm text-subtle">
//                   Specify your own logo to replace the standard Arnold AI logo.
//                 </p>
//               )}

//               <ImageUpload
//                 selectedFile={selectedLogo}
//                 setSelectedFile={setSelectedLogo}
//               />
//             </div> */}

//             {/* TODO: polish the features here*/}
//             {/* <AdvancedOptionsToggle
//                 showAdvancedOptions={showAdvancedOptions}
//                 setShowAdvancedOptions={setShowAdvancedOptions}
//               />

//               {showAdvancedOptions && (
//                 <div className="w-full flex flex-col gap-y-4">
//                   <Text>
//                     Read{" "}
//                     <Link
//                       href={"#"}
//                       className="text-link cursor-pointer"
//                     >
//                       the docs
//                     </Link>{" "}
//                     to see whitelabelling examples in action.
//                   </Text>

//                   <TextFormField
//                     label="Chat Header Content"
//                     name="custom_header_content"
//                     subtext={`Custom Markdown content that will be displayed as a banner at the top of the Chat page.`}
//                     placeholder="Your header content..."
//                     disabled={isSubmitting}
//                   />

//                   <BooleanFormField
//                     name="two_lines_for_chat_header"
//                     label="Two lines for chat header?"
//                     subtext="If enabled, the chat header will be displayed on two lines instead of one."
//                   />

//                   <div className="pt-2" />

//                   <TextFormField
//                     label={
//                       values.enable_consent_screen
//                         ? "Consent Screen Header"
//                         : "Popup Header"
//                     }
//                     name="custom_popup_header"
//                     subtext={
//                       values.enable_consent_screen
//                         ? `The title for the consent screen that will be displayed for each user on their initial visit to the application. If left blank, title will default to "Terms of Use".`
//                         : `The title for the popup that will be displayed for each user on their initial visit to the application. If left blank AND Custom Popup Content is specified, will use "Welcome to ${values.workspace_name || "Arnold AI"}!".`
//                     }
//                     placeholder={
//                       values.enable_consent_screen
//                         ? "Consent Screen Header"
//                         : "Initial Popup Header"
//                     }
//                     disabled={isSubmitting}
//                   />

//                   <TextFormField
//                     label={
//                       values.enable_consent_screen
//                         ? "Consent Screen Content"
//                         : "Popup Content"
//                     }
//                     name="custom_popup_content"
//                     subtext={
//                       values.enable_consent_screen
//                         ? `Custom Markdown content that will be displayed as a consent screen on initial visit to the application. If left blank, will default to "By clicking 'I Agree', you acknowledge that you agree to the terms of use of this application and consent to proceed."`
//                         : `Custom Markdown content that will be displayed as a popup on initial visit to the application.`
//                     }
//                     placeholder={
//                       values.enable_consent_screen
//                         ? "Your consent screen content..."
//                         : "Your popup content..."
//                     }
//                     isTextArea
//                     disabled={isSubmitting}
//                   />

//                   <BooleanFormField
//                     name="enable_consent_screen"
//                     label="Enable Consent Screen"
//                     subtext="If enabled, the initial popup will be transformed into a consent screen. Users will be required to agree to the terms before accessing the application on their first login."
//                     disabled={isSubmitting}
//                   />

//                   <TextFormField
//                     label="Chat Footer Text"
//                     name="custom_lower_disclaimer_content"
//                     subtext={`Custom Markdown content that will be displayed at the bottom of the Chat page.`}
//                     placeholder="Your disclaimer content..."
//                     isTextArea
//                     disabled={isSubmitting}
//                   />

//                   <div>
//                     <h3>Chat Footer Logotype</h3>

//                     {values.use_custom_logotype ? (
//                       <div className="mt-3">
//                         <SubLabel>Current Custom Logotype: </SubLabel>
//                         <Image
//                           src={
//                             "/api/workspace/logotype?u=" + Date.now()
//                           }
//                           alt="logotype"
//                           style={{ objectFit: "contain" }}
//                           className="w-32 h-32 mb-10 mt-4"
//                         />

//                         <Button
//                           color="red"
//                           size="xs"
//                           type="button"
//                           className="mb-8"
//                           onClick={async () => {
//                             const valuesWithoutLogotype = {
//                               ...values,
//                               use_custom_logotype: false,
//                             };
//                             await updateWorkspaces(valuesWithoutLogotype);
//                             setValues(valuesWithoutLogotype);
//                           }}
//                         >
//                           Delete
//                         </Button>

//                         <SubLabel>
//                           Override your uploaded custom logotype by uploading a
//                           new image below and clicking the Update button. This
//                           logotype is the text-based logo that will be rendered at
//                           the bottom right of the chat screen.
//                         </SubLabel>
//                       </div>
//                     ) : (
//                       <SubLabel>
//                         Add a custom logotype by uploading a new image below and
//                         clicking the Update button. This logotype is the
//                         text-based logo that will be rendered at the bottom right
//                         of the chat screen.
//                       </SubLabel>
//                     )}
//                     <ImageUpload
//                       selectedFile={selectedLogotype}
//                       setSelectedFile={setSelectedLogotype}
//                     />
//                   </div>
//                 </div>
//               )} */}
//           </Form>
//         )}
//       </Formik>
//     </div>
//   );
// }

"use client";

import { useRouter } from "next/navigation";
import { Workspaces } from "@/app/admin/settings/interfaces";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import {
  BooleanFormField,
  SubLabel,
  TextFormField,
} from "@/components/admin/connectors/Field";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { AdvancedOptionsToggle } from "@/components/AdvancedOptionsToggle";
import { Text } from "@tremor/react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "../ImageUpload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function General() {
  const settings = useContext(SettingsContext);
  if (!settings) {
    return null;
  }
  const workspaces = settings.workspaces;
  const { toast } = useToast();
  const router = useRouter();
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedHeaderLogo, setSelectedHeaderLogo] = useState<File | null>(
    null
  );
  const [selectedLogotype, setSelectedLogotype] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    smtp_server: settings.settings.smtp_server,
    smtp_port: settings.settings.smtp_port,
    smtp_username: settings.settings.smtp_username,
    smtp_password: settings.settings.smtp_password,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [palette, setPalette] = useState(null);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "https://tailwind.simeongriggs.dev/api/brand/2522FC",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching data:", err);
        console.log("G");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  async function updateWorkspaces(newValues: Workspaces) {
    const response = await fetch("/api/admin/workspace", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(workspaces || {}),
        ...newValues,
      }),
    });
    if (response.ok) {
      router.refresh();
      toast({
        title: "Settings updated",
        description: "The workspace settings have been successfully updated.",
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: "Failed to update settings.",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }

  async function updateSmtpSettings(workspaceId: number, smtpSettings: any) {
    setLoading(true);
    const response = await fetch(
      `/api/admin/settings/workspace/${workspaceId}/smtp`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smtpSettings),
      }
    );

    setLoading(false);
    if (response.ok) {
      toast({
        title: "SMTP Settings Updated",
        description: "The SMTP settings have been successfully updated.",
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: "Failed to update SMTP settings.",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "smtp_port" ? parseInt(value, 10) : value,
    }));
  };

  return (
    <div className="pt-6">
      <div>
        <h1>Fetched Data</h1>
        <pre>{data}</pre>
      </div>
      <Formik
        initialValues={{
          workspace_name: workspaces?.workspace_name || null,
          workspace_description: workspaces?.workspace_description || null,
          use_custom_logo: workspaces?.use_custom_logo || false,
          use_custom_logotype: workspaces?.use_custom_logotype || false,
          custom_header_logo: workspaces?.custom_header_logo || "",
          custom_header_content: workspaces?.custom_header_content || "",
          two_lines_for_chat_header:
            workspaces?.two_lines_for_chat_header || false,
          custom_popup_header: workspaces?.custom_popup_header || "",
          custom_popup_content: workspaces?.custom_popup_content || "",
          custom_lower_disclaimer_content:
            workspaces?.custom_lower_disclaimer_content || "",
          custom_nav_items: workspaces?.custom_nav_items || [],
          enable_consent_screen: workspaces?.enable_consent_screen || false,
          brand_color: workspaces?.brand_color || "",
        }}
        validationSchema={Yup.object().shape({
          workspace_name: Yup.string().nullable(),
          workspace_description: Yup.string().nullable(),
          use_custom_logo: Yup.boolean().required(),
          custom_header_logo: Yup.string().nullable(),
          use_custom_logotype: Yup.boolean().required(),
          custom_header_content: Yup.string().nullable(),
          two_lines_for_chat_header: Yup.boolean().nullable(),
          custom_popup_header: Yup.string().nullable(),
          custom_popup_content: Yup.string().nullable(),
          custom_lower_disclaimer_content: Yup.string().nullable(),
          enable_consent_screen: Yup.boolean().nullable(),
        })}
        onSubmit={async (values, formikHelpers) => {
          formikHelpers.setSubmitting(true);

          if (selectedLogo) {
            values.use_custom_logo = true;

            const formData = new FormData();
            formData.append("file", selectedLogo);
            setSelectedLogo(null);
            const response = await fetch("/api/admin/workspace/logo", {
              method: "PUT",
              body: formData,
            });
            if (!response.ok) {
              const errorMsg = (await response.json()).detail;
              toast({
                title: "Failed to upload logo",
                description: `Error: ${errorMsg}`,
                variant: "destructive",
              });
              formikHelpers.setSubmitting(false);
              return;
            }
          }

          if (selectedHeaderLogo) {
            const formData = new FormData();
            formData.append("file", selectedHeaderLogo);
            setSelectedHeaderLogo(null);

            const response = await fetch("/api/admin/workspace/header-logo", {
              method: "PUT",
              body: formData,
            });

            if (response.ok) {
              const responseData = await response.json();
              values.custom_header_logo = responseData.file_path;
              toast({
                title: "Header logo uploaded",
                description: "The header logo has been successfully uploaded.",
                variant: "success",
              });
            } else {
              const errorMsg = (await response.json()).detail;
              toast({
                title: "Failed to upload header logo",
                description: `Error: ${errorMsg}`,
                variant: "destructive",
              });
              formikHelpers.setSubmitting(false);
              return;
            }
          }

          if (selectedLogotype) {
            values.use_custom_logotype = true;

            const formData = new FormData();
            formData.append("file", selectedLogotype);
            setSelectedLogotype(null);
            const response = await fetch(
              "/api/admin/workspace/logo?is_logotype=true",
              {
                method: "PUT",
                body: formData,
              }
            );
            if (!response.ok) {
              const errorMsg = (await response.json()).detail;
              alert(`Failed to upload logo. ${errorMsg}`);
              formikHelpers.setSubmitting(false);
              return;
            }
          }

          formikHelpers.setValues(values);
          await updateWorkspaces(values);

          toast({
            title: "Updated Successfully",
            description: "Workspace successfully updated.",
            variant: "success",
          });
        }}
      >
        {({ isSubmitting, values, setValues, setFieldValue }) => (
          <Form>
            <div className="py-8 border-b">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="workspace_name"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    Workspace Name
                  </Label>
                  <p className="text-sm text-muted-foreground pb-1.5">
                    The custom name you are giving for your workspace. This will
                    replace 'Arnold AI' everywhere in the UI.
                  </p>
                </div>

                <div className="md:w-[500px]">
                  <Input
                    name="workspace_name"
                    value={values.workspace_name || ""}
                    onChange={(e) =>
                      setFieldValue("workspace_name", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="py-8 border-b">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="workspace_description"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    Description
                  </Label>
                  <p className="text-sm text-muted-foreground pb-1.5">
                    {`The custom description metadata you are giving ${
                      values.workspace_name || "Arnold AI"
                    } for your workspace.\
                  This will be seen when sharing the link or searching through the browser.`}
                  </p>
                </div>

                <div className="md:w-[500px]">
                  <Input
                    name="workspace_description"
                    placeholder="Custom description for your Workspace"
                    value={values.workspace_description || ""}
                    onChange={(e) =>
                      setFieldValue("workspace_description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="py-8 border-b">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="custom_logo"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    Logo
                  </Label>
                  <p className="text-sm text-muted-foreground pb-1.5">
                    Specify your own logo to replace the standard Arnold AI
                    logo.
                  </p>
                </div>

                <div className="md:w-[500px]">
                  <ImageUpload
                    selectedFile={selectedLogo}
                    setSelectedFile={setSelectedLogo}
                  />
                </div>
              </div>
            </div>

            <div className="py-8 border-b">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="custom_logo"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    Header Logo
                  </Label>
                  <p className="text-sm text-muted-foreground pb-1.5">
                    Specify your own header logo to replace the standard Arnold
                    AI header logo.
                  </p>
                </div>

                <div className="md:w-[500px]">
                  <ImageUpload
                    selectedFile={selectedHeaderLogo}
                    setSelectedFile={setSelectedHeaderLogo}
                  />
                </div>
              </div>
            </div>

            <div className="py-8 border-b">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="grid leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                  <Label
                    htmlFor="workspace_description"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                  >
                    Brand Theme
                  </Label>
                  <p className="text-sm text-muted-foreground pb-1.5">
                    Select your customize brand color.
                  </p>
                </div>

                <div className="md:w-[500px]">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-subtle">Custom color:</span>
                    <TextFormField
                      name="brand_color"
                      width="w-32"
                      optional
                      noPadding
                    />

                    <div className="flex gap-2">
                      {workspaces?.brand_color && (
                        <div
                          className="w-10 h-10 rounded-full border-white border-2 cursor-pointer shrink-0"
                          style={{
                            background: workspaces?.brand_color,
                            outline: `1px solid ${workspaces?.brand_color}`,
                          }}
                        />
                      )}
                      <div className="w-10 h-10 bg-brand-500 rounded-full outline-brand-500 outline-1 outline border-white border-2 cursor-pointer shrink-0" />
                      <div className="w-10 h-10 bg-background-inverted rounded-full outline-background-ibg-background-inverted outline-1 outline border-white border-2 cursor-pointer shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit">Update</Button>
            </div>

            <div className="pt-20">
              {/* <div className="py-8 border-b">
                <div className="flex gap-5 flex-col md:flex-row">
                  <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                    <Label
                      htmlFor="workspace_description"
                      className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                    >
                      Custom Domain
                    </Label>
                    <p className="text-sm text-muted-foreground pb-1.5">
                      Custom domains allow you to serve your site from a domain
                    </p>
                  </div>

                  <div className="flex md:w-[500px]">
                    <TextFormField
                      name="custom_domain"
                      placeholder="Enter custom domain"
                      width="w-full"
                      //remove this
                      optional
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost">Cancel</Button>
                      <Button>Save</Button>
                    </div>
                  </div>
                </div>
              </div> */}

              <div className="py-8 border-b">
                <div className="flex gap-5 flex-col md:flex-row">
                  <div className="leading-none md:w-96 lg:w-60 xl:w-[500px] shrink-0">
                    <Label
                      htmlFor="workspace_description"
                      className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed pb-1.5"
                    >
                      SMTP
                    </Label>
                    <p className="text-sm text-muted-foreground pb-1.5">
                      Enables the exchange of emails between servers.
                    </p>
                  </div>

                  <div className="md:w-[500px]">
                    <div className="flex flex-col items-end">
                      <div className="w-full flex flex-col gap-4">
                        {isEditing ? (
                          <>
                            <TextFormField
                              name="smtp_server"
                              label="SMTP Server"
                              placeholder="Enter hostname"
                              //remove this
                              optional
                              value={formData.smtp_server}
                              onChange={handleChange}
                            />

                            <TextFormField
                              name="smtp_port"
                              label="SMTP Port"
                              placeholder="Enter port"
                              optional
                              type="text"
                              value={formData.smtp_port.toString()}
                              onChange={handleChange}
                            />

                            <TextFormField
                              name="smtp_username"
                              label="SMTP Username (email)"
                              placeholder="Enter username"
                              //remove this
                              optional
                              value={formData.smtp_username}
                              onChange={handleChange}
                            />

                            <TextFormField
                              name="smtp_password"
                              label="SMTP Password"
                              placeholder="Enter password"
                              //remove this
                              optional
                              type="password"
                              value={formData.smtp_password}
                              onChange={handleChange}
                            />
                          </>
                        ) : (
                          <>
                            <div className="flex gap-6">
                              <span className="whitespace-nowrap">
                                SMTP Server:
                              </span>
                              <span className="font-semibold text-inverted-inverted w-full truncate">
                                {settings.settings.smtp_server || "None"}
                              </span>
                            </div>

                            <div className="flex gap-6">
                              <span className="whitespace-nowrap">
                                SMTP Port:
                              </span>
                              <span className="font-semibold text-inverted-inverted w-full truncate">
                                {settings.settings.smtp_port}
                              </span>
                            </div>

                            <div className="flex gap-6">
                              <span className="whitespace-nowrap">
                                SMTP Username (email):
                              </span>
                              <span className="font-semibold text-inverted-inverted w-full truncate">
                                {settings.settings.smtp_username || "None"}
                              </span>
                            </div>

                            <div className="flex gap-6">
                              <span className="whitespace-nowrap">
                                SMTP Password:
                              </span>
                              <span className="font-semibold text-inverted-inverted truncate">
                                &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-end">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={async () => {
                                  await updateSmtpSettings(0, formData);
                                  setFormData({
                                    smtp_server: "",
                                    smtp_port: 0,
                                    smtp_username: "",
                                    smtp_password: "",
                                  });
                                  setIsEditing(false);
                                }}
                                disabled={loading}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setIsEditing(true)}
                              type="button"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div>
              {values.use_custom_logo ? (
                <div className="pt-3 flex flex-col items-start gap-3">
                  <div>
                    <h3>Custom Logo</h3>
                    <SubLabel>Current Custom Logo: </SubLabel>
                  </div>
                  <img
                    src={"/api/workspace/logo?workspace_id=" + 0} //temporary id for workspace
                    alt="Logo"
                    style={{ objectFit: "contain" }}
                    className="w-32 h-32"
                  />

                  <Button
                    variant="destructive"
                    type="button"
                    onClick={async () => {
                      const valuesWithoutLogo = {
                        ...values,
                        use_custom_logo: false,
                      };
                      await updateWorkspaces(valuesWithoutLogo);
                      setValues(valuesWithoutLogo);
                    }}
                  >
                    Delete
                  </Button>

                  <p className="text-sm text-subtle pt-4 pb-2">
                    Override the current custom logo by uploading a new image
                    below and clicking the Update button.
                  </p>
                </div>
              ) : (
                <p className="pb-3 text-sm text-subtle">
                  Specify your own logo to replace the standard Arnold AI logo.
                </p>
              )}

              <ImageUpload
                selectedFile={selectedLogo}
                setSelectedFile={setSelectedLogo}
              />
            </div> */}

            {/* TODO: polish the features here*/}
            {/* <AdvancedOptionsToggle
                showAdvancedOptions={showAdvancedOptions}
                setShowAdvancedOptions={setShowAdvancedOptions}
              />

              {showAdvancedOptions && (
                <div className="w-full flex flex-col gap-y-4">
                  <Text>
                    Read{" "}
                    <Link
                      href={"#"}
                      className="text-link cursor-pointer"
                    >
                      the docs
                    </Link>{" "}
                    to see whitelabelling examples in action.
                  </Text>

                  <TextFormField
                    label="Chat Header Content"
                    name="custom_header_content"
                    subtext={`Custom Markdown content that will be displayed as a banner at the top of the Chat page.`}
                    placeholder="Your header content..."
                    disabled={isSubmitting}
                  />

                  <BooleanFormField
                    name="two_lines_for_chat_header"
                    label="Two lines for chat header?"
                    subtext="If enabled, the chat header will be displayed on two lines instead of one."
                  />

                  <div className="pt-2" />

                  <TextFormField
                    label={
                      values.enable_consent_screen
                        ? "Consent Screen Header"
                        : "Popup Header"
                    }
                    name="custom_popup_header"
                    subtext={
                      values.enable_consent_screen
                        ? `The title for the consent screen that will be displayed for each user on their initial visit to the application. If left blank, title will default to "Terms of Use".`
                        : `The title for the popup that will be displayed for each user on their initial visit to the application. If left blank AND Custom Popup Content is specified, will use "Welcome to ${values.workspace_name || "Arnold AI"}!".`
                    }
                    placeholder={
                      values.enable_consent_screen
                        ? "Consent Screen Header"
                        : "Initial Popup Header"
                    }
                    disabled={isSubmitting}
                  />

                  <TextFormField
                    label={
                      values.enable_consent_screen
                        ? "Consent Screen Content"
                        : "Popup Content"
                    }
                    name="custom_popup_content"
                    subtext={
                      values.enable_consent_screen
                        ? `Custom Markdown content that will be displayed as a consent screen on initial visit to the application. If left blank, will default to "By clicking 'I Agree', you acknowledge that you agree to the terms of use of this application and consent to proceed."`
                        : `Custom Markdown content that will be displayed as a popup on initial visit to the application.`
                    }
                    placeholder={
                      values.enable_consent_screen
                        ? "Your consent screen content..."
                        : "Your popup content..."
                    }
                    isTextArea
                    disabled={isSubmitting}
                  />

                  <BooleanFormField
                    name="enable_consent_screen"
                    label="Enable Consent Screen"
                    subtext="If enabled, the initial popup will be transformed into a consent screen. Users will be required to agree to the terms before accessing the application on their first login."
                    disabled={isSubmitting}
                  />

                  <TextFormField
                    label="Chat Footer Text"
                    name="custom_lower_disclaimer_content"
                    subtext={`Custom Markdown content that will be displayed at the bottom of the Chat page.`}
                    placeholder="Your disclaimer content..."
                    isTextArea
                    disabled={isSubmitting}
                  />

                  <div>
                    <h3>Chat Footer Logotype</h3>

                    {values.use_custom_logotype ? (
                      <div className="mt-3">
                        <SubLabel>Current Custom Logotype: </SubLabel>
                        <Image
                          src={
                            "/api/workspace/logotype?u=" + Date.now()
                          }
                          alt="logotype"
                          style={{ objectFit: "contain" }}
                          className="w-32 h-32 mb-10 mt-4"
                        />

                        <Button
                          color="red"
                          size="xs"
                          type="button"
                          className="mb-8"
                          onClick={async () => {
                            const valuesWithoutLogotype = {
                              ...values,
                              use_custom_logotype: false,
                            };
                            await updateWorkspaces(valuesWithoutLogotype);
                            setValues(valuesWithoutLogotype);
                          }}
                        >
                          Delete
                        </Button>

                        <SubLabel>
                          Override your uploaded custom logotype by uploading a
                          new image below and clicking the Update button. This
                          logotype is the text-based logo that will be rendered at
                          the bottom right of the chat screen.
                        </SubLabel>
                      </div>
                    ) : (
                      <SubLabel>
                        Add a custom logotype by uploading a new image below and
                        clicking the Update button. This logotype is the
                        text-based logo that will be rendered at the bottom right
                        of the chat screen.
                      </SubLabel>
                    )}
                    <ImageUpload
                      selectedFile={selectedLogotype}
                      setSelectedFile={setSelectedLogotype}
                    />
                  </div>
                </div>
              )} */}
          </Form>
        )}
      </Formik>
    </div>
  );
}
