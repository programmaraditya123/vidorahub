import { http2 } from "../http2";

export type CategorySelectEventPayload = {
  eventId: string;
  categorySelected: string;
  deviceId: string;
  userId?: string | null;
  profileId?: string | null;
  sessionId?: string | null;
};

export type CategorySelectEventResponse = {
  success?: boolean;
  message?: string;
};

const validateCategorySelectEvent = (
  data: CategorySelectEventPayload
): Required<CategorySelectEventPayload> => {
  if (!data.eventId) {
    throw new Error("eventId is required");
  }

  if (!data.categorySelected) {
    throw new Error("categorySelected is required");
  }

  if (!data.deviceId) {
    throw new Error("deviceId  is required");
  }

  if (
    data.userId !== null &&
    data.userId !== undefined &&
    typeof data.userId !== "string"
  ) {
    throw new Error("userId must be a string or null");
  }

  if (
    data.profileId !== null &&
    data.profileId !== undefined &&
    typeof data.profileId !== "string"
  ) {
    throw new Error("profileId must be a string or null");
  }

  if (
    data.sessionId !== null &&
    data.sessionId !== undefined &&
    typeof data.sessionId !== "string"
  ) {
    throw new Error("sessionId must be a string or null");
  }

  return {
    eventId: data.eventId,
    categorySelected: data.categorySelected,
    deviceId: data.deviceId,
    userId: data.userId ?? null,
    profileId: data.profileId ?? null,
    sessionId: data.sessionId ?? null,
  };
};

export async function sendCategorySelectEvent(
  payload: CategorySelectEventPayload
) {
  const { data } = await http2.post<CategorySelectEventResponse>(
    "/c/v1/selectedcategory",
    validateCategorySelectEvent(payload)
  );

  return data;
}
