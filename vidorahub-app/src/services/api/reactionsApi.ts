import { http2 } from './client';
import type { ReactionResponse, FollowResponse } from '@/types';

export type ReactionPayload = {
  userSerialNumber: number;
  videoSerialNumber: number;
};

export async function addLike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>('bitmap/v1/addLike', payload);
  return data;
}

export async function removeLike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>('bitmap/v1/removeLike', payload);
  return data;
}

export async function addDislike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>('bitmap/v1/addDislike', payload);
  return data;
}

export async function removeDislike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>('bitmap/v1/removeDislike', payload);
  return data;
}

export async function getVideoReactions(
  videoSerialNumber: number,
  userSerialNumber?: number,
) {
  const params: Record<string, number> = { videoSerialNumber };
  if (userSerialNumber !== undefined) params.userSerialNumber = userSerialNumber;

  const { data } = await http2.get<ReactionResponse>('bitmap/v1/reactions', {
    params,
  });
  return data;
}

export async function getFollowReaction(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number,
) {
  const { data } = await http2.get<FollowResponse>(
    `bitmap/v1/followReaction/${creatorId}`,
    {
      params: {
        userserialnumber: userSerialNumber,
        creatorserialnumber: creatorSerialNumber,
      },
    },
  );
  return data;
}

export async function followCreator(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number,
) {
  const { data } = await http2.post(`bitmap/v1/follow/${creatorId}`, {
    userSerialNumber,
    creatorSerialNumber,
  });
  return data;
}

export async function unfollowCreator(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number,
) {
  const { data } = await http2.post(`bitmap/v1/unfollow/${creatorId}`, {
    userSerialNumber,
    creatorSerialNumber,
  });
  return data;
}
