import { UUID } from "crypto";
import { User } from "./types";

export const checkUserIsNoAuthUser = (userId: string) => {
  return userId === "__no_auth_user__";
};

export const getCurrentUser = async (): Promise<User | null> => {
  const response = await fetch("/api/me", {
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  const user = await response.json();
  return user;
};

export const getCurrentTeamspaceUser = async (
  teamspaceId: string
): Promise<User | null> => {
  const response = await fetch(`/api/me?teamspace_id=${teamspaceId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  const user = await response.json();
  return user;
};

export const logout = async (): Promise<Response> => {
  const response = await fetch("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return response;
};

export const generateOtp = async (email: string): Promise<Response> => {
  const response = await fetch(`/api/users/generate-otp?email=${email}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return response;
};

export const basicLogin = async (
  email: string,
  password: string
): Promise<Response> => {
  const params = new URLSearchParams([
    ["username", email],
    ["password", password],
  ]);

  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  return response;
};

export const basicSignup = async (
  full_name: string,
  company_name: string,
  email: string,
  password: string,
  token?: string
) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name,
      company_name,
      email,
      password,
      token,
    }),
  });
  return response;
};

export const validateInvite = async (email: string, token: string) => {
  const response = await fetch(
    `/api/users/validate-token-invite?email=${email}&token=${token}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response;
};
