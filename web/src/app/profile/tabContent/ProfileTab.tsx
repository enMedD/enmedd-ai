"use client";

import { Button } from "@/components/ui/button";
import { User as UserTypes } from "@/lib/types";
import { UserProfile } from "@/components/UserProfile";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  GLOBAL_ERROR_MESSAGES,
  OPERATION_ERROR_MESSAGES,
} from "@/constants/error";
import { PROFILE_SUCCESS_MESSAGES } from "@/constants/success";

export default function ProfileTab({ user }: { user: UserTypes | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [companyName, setCompanyName] = useState(user?.company_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // TODO: Update instantly when user profile changes
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await fetch("/api/me/profile");
        if (response.ok) {
          const imageBlob = await response.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          setProfileImageUrl(imageUrl);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();
  }, []);

  const handleSaveChanges = async () => {
    setIsLoading(true);

    try {
      const updateResponse = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        toast({
          title: OPERATION_ERROR_MESSAGES.ACTION.title("Update"),
          description: OPERATION_ERROR_MESSAGES.ACTION.description(
            "profile",
            "update",
            error.detail
          ),
          variant: "destructive",
        });
        return;
      }

      // Upload logo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/me/profile", {
          method: "PUT",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();

          toast({
            title: OPERATION_ERROR_MESSAGES.ACTION.title("Profile Upload"),
            description: OPERATION_ERROR_MESSAGES.ACTION.description(
              "profile",
              "upload",
              error.detail
            ),
            variant: "destructive",
          });
          return;
        }
      }

      router.refresh();
      toast({
        title: PROFILE_SUCCESS_MESSAGES.UPDATE.title,
        description: PROFILE_SUCCESS_MESSAGES.UPDATE.description,
        variant: "success",
      });
      setIsEditing(false);
    } catch (error) {
      console.log(error);
      toast({
        title: GLOBAL_ERROR_MESSAGES.UNKNOWN.title,
        description: GLOBAL_ERROR_MESSAGES.UNKNOWN.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpload = () => {
    setIsEditing(true);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setSelectedFile(file);
    };
    fileInput.click();
  };

  const handleRemovePhoto = async () => {
    setSelectedFile(null);
    const response = await fetch("/api/me/profile", {
      method: "DELETE",
    });
    if (response.ok) {
      router.refresh();
      setProfileImageUrl(null);
      toast({
        title: PROFILE_SUCCESS_MESSAGES.REMOVE_PHOTO.title,
        description: PROFILE_SUCCESS_MESSAGES.REMOVE_PHOTO.description,
        variant: "success",
      });
    } else {
      const errorMsg = (await response.json()).detail;
      toast({
        title: OPERATION_ERROR_MESSAGES.ACTION.title("Removing Photo"),
        description: OPERATION_ERROR_MESSAGES.ACTION.description(
          "photo",
          "remove",
          errorMsg
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex py-8 border-b gap-5">
        <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
          <span className="font-semibold text-inverted-inverted">
            Your Photo
          </span>
          <p className="pt-1 text-sm">
            This will be displayed on your profile.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 cursor-pointer">
          <div
            className="flex items-center justify-center rounded-full h-[65px] w-[65px] shrink-0 aspect-square text-2xl font-normal overflow-hidden"
            onClick={handleProfileUpload}
          >
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="selected_teamspace_logo"
                className="w-full h-full object-cover object-center"
              />
            ) : profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="current_teamspace_logo"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <UserProfile size={65} user={user} textSize="text-2xl" />
            )}
          </div>

          {isEditing && (selectedFile || profileImageUrl) && (
            <Button
              variant="link"
              className="text-destructive"
              onClick={handleRemovePhoto}
              disabled={isLoading}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="py-8 border-b flex flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">Name</span>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                value={fullName}
                placeholder="Enter Full Name"
                onChange={(e) => setFullName(e.target.value)}
              />
            ) : (
              <span className="text-inverted-inverted w-full truncate">
                {fullName || "Unknown User"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">
              Company
            </span>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                value={companyName}
                placeholder="Enter Company Name"
                onChange={(e) => setCompanyName(e.target.value)}
              />
            ) : (
              <span className="text-inverted-inverted w-full truncate">
                {companyName || "No Company"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">Email</span>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                disabled
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            ) : (
              <span className="text-inverted-inverted w-full truncate">
                {email || "anonymous@gmail.com"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 py-8 justify-end">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              className="border-destructive-foreground hover:bg-destructive-100"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            Edit
          </Button>
        )}
      </div>
    </>
  );
}
