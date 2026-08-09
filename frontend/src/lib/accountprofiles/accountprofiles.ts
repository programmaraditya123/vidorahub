import { http } from "@/src/lib/http";

export type AccountProfile = {
  _id: string;
  accountId?: string;
  name: string;
  profilePicUrl?: string;
  profileType?: "adult" | "kids" | "teen" | "custom";
  isPrimary?: boolean;
  isActive?: boolean;
  isKidsProfile?: boolean;
  dateOfBirth?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type CreateAccountProfilePayload = {
  name: string;
  dateOfBirth?: string;
  isPrimary?: boolean;
  pinHash?: string;
};

export async function getAccountProfiles() {
  const { data } = await http.get<ApiResponse<AccountProfile[]>>(
    "/api/v1/getprofiles"
  );

  return data;
}

export async function createAccountProfile(
  payload: CreateAccountProfilePayload
) {
  const { data } = await http.post<ApiResponse<AccountProfile>>(
    "/api/v1/accountprofile",
    payload
  );

  return data;
}

export async function switchAccountProfile(profileId: string) {
  const { data } = await http.patch<ApiResponse<AccountProfile>>(
    "/api/v1/switchProfile",
    { profileId }
  );

  return data;
}
