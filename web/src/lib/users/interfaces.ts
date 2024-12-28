import { User } from "../types";

export interface InvitedUser extends User {
  email: string;
  is_expired: boolean;
}
export interface UsersResponse {
  accepted: User[];
  invited: InvitedUser[];
  accepted_pages: number;
  invited_pages: number;
}
