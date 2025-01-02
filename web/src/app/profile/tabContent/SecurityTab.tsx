"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User as UserTypes } from "@/lib/types";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import {
  GLOBAL_ERROR_MESSAGES,
  PASSWORD_ERROR_MESSAGES,
} from "@/constants/error";
import { PASSWORD_SUCCESS_MESSAGES } from "@/constants/success";

export default function SecurityTab() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    hasUppercase,
    hasNumberOrSpecialChar,
    passwordWarning,
    calculatePasswordStrength,
    setPasswordFocused,
  } = usePasswordValidation();

  const handleSaveChanges = async () => {
    if (newPassword.length < 8 || !hasUppercase || !hasNumberOrSpecialChar) {
      toast({
        title: PASSWORD_ERROR_MESSAGES.REQUIREMENTS.title,
        description:
          PASSWORD_ERROR_MESSAGES.REQUIREMENTS.description(passwordWarning),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: PASSWORD_ERROR_MESSAGES.NOT_MATCH.title,
        description: PASSWORD_ERROR_MESSAGES.NOT_MATCH.description,
        variant: "destructive",
      });
      return;
    }

    const updatedPasswordInfo = {
      current_password: currentPassword,
      new_password: newPassword,
    };
    const response = await fetch("/api/users/change-password", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(updatedPasswordInfo),
    });

    if (response.status === 200) {
      toast({
        title: PASSWORD_SUCCESS_MESSAGES.CHANGE.title,
        description: PASSWORD_SUCCESS_MESSAGES.CHANGE.description,
        variant: "success",
      });
      setIsEditing(false);
    } else if (response.status === 400) {
      toast({
        title: PASSWORD_ERROR_MESSAGES.INCORRECT_CURRENT_PASSWORD.title,
        description:
          PASSWORD_ERROR_MESSAGES.INCORRECT_CURRENT_PASSWORD.description,
        variant: "destructive",
      });
    } else {
      toast({
        title: GLOBAL_ERROR_MESSAGES.UNEXPECTED.title,
        description: GLOBAL_ERROR_MESSAGES.UNEXPECTED.description(
          `${response.status} - ${response.statusText}`
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex py-8 border-b flex-col">
        <h3>Password</h3>
        <p className="pt-1 text-sm">
          Please enter your current password to change your password
        </p>
      </div>

      <div className="py-8 border-b flex flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">
              Current Password
            </span>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full"
                placeholder="Enter current password"
              />
            ) : (
              <span className="font-semibold text-inverted-inverted w-full truncate">
                &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0 pt-2">
            <span className="font-semibold text-inverted-inverted">
              New Password
            </span>
          </div>
          <div className="md:w-[500px]">
            <div
              className={`w-full h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
            >
              {isEditing ? (
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    calculatePasswordStrength(e.target.value);
                  }}
                  className="w-full"
                  placeholder="Enter new password"
                />
              ) : (
                <span className="font-semibold text-inverted-inverted truncate">
                  &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
                </span>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-5">
                <div className="text-sm text-subtle pt-2">
                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={16}
                      color={newPassword.length >= 8 ? "#69c57d" : "gray"}
                    />
                    <p>At least 8 characters</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={16}
                      color={hasUppercase ? "#69c57d" : "gray"}
                    />
                    <p>At least 1 Capital letter</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={16}
                      color={hasNumberOrSpecialChar ? "#69c57d" : "gray"}
                    />
                    <p>At least 1 number or special character</p>
                  </div>
                  {passwordWarning && (
                    <p className="text-red-500">{passwordWarning}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="w-44 sm:w-96 lg:w-[500px] shrink-0">
            <span className="font-semibold text-inverted-inverted">
              Confirm Password
            </span>
          </div>
          <div
            className={`md:w-[500px] h-10 flex items-center justify-between ${isEditing ? "" : "truncate"}`}
          >
            {isEditing ? (
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
                placeholder="Confirm new password"
              />
            ) : (
              <span className="font-semibold text-inverted-inverted truncate">
                &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
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
              onClick={() => setIsEditing(!isEditing)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            Edit
          </Button>
        )}
      </div>
    </>
  );
}
