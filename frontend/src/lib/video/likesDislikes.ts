import { http2 } from "../http2";

export interface ReactionPayload {
  userSerialNumber: number;
  videoSerialNumber: number;
}

export interface VideoReactionsResponse {
  success: boolean;
  liked: boolean;
  disliked: boolean;
  likes: number;
  dislikes: number;
}

export interface ReactionResponse {
  success: boolean;
  liked: boolean;
  disliked: boolean;
  likes: number;
  dislikes: number;
}

export interface UserReactionVideo {
  _id: string;
  title?: string;
  thumbnailUrl?: string;
  duration?: number | string | null;
  contentType?: string;
  uploader?: {
    _id?: string;
    name?: string;
    profilePicUrl?: string;
  } | null;
  isDeleted?: boolean;
  stats?: {
    views?: number;
    likes?: number;
  };
  videoUrl?: string;
  videoSerialNumber: number;
  createdAt?: string;
  reaction?: {
    scope?: "like" | "dislike";
    updatedAt?: string;
  };
}

export interface UserReactionVideosResponse {
  success: boolean;
  userSerialNumber: number;
  limit: number;
  count?: number;
  videos: UserReactionVideo[];
  nextPageState: string | null;
  hasMore: boolean;
}



export async function addLike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>(
    "bitmap/v1/addLike",
    payload
  );
  return data;
}


export async function removeLike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>(
    "bitmap/v1/removeLike",
    payload
  );
  return data;
}

export async function addDislike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>(
    "bitmap/v1/addDislike",
    payload
  );
  return data;
}


export async function removeDislike(payload: ReactionPayload) {
  const { data } = await http2.post<ReactionResponse>(
    "bitmap/v1/removeDislike",
    payload
  );
  return data;
}



export async function getVideoReactions(
  videoSerialNumber: number,
  userSerialNumber?: number
) {
  const params: any = { videoSerialNumber };

  if (userSerialNumber !== undefined) {
    params.userSerialNumber = userSerialNumber;
  }

  const { data } = await http2.get<VideoReactionsResponse>(
    "bitmap/v1/reactions",
    { params }
  );

  return data;
}

type GetUserReactionVideosParams = {
  userSerialNumber: number;
  pageState?: string | null;
};

async function getUserReactionVideos(
  endpoint: "getLikedVideos" | "getDislikedVideos",
  { userSerialNumber, pageState = null }: GetUserReactionVideosParams
) {
  const { data } = await http2.get<UserReactionVideosResponse>(
    `bitmap/v1/${endpoint}`,
    {
      params: {
        userSerialNumber,
        ...(pageState ? { pageState } : {}),
      },
    }
  );

  return data;
}

export async function getLikedVideos(params: GetUserReactionVideosParams) {
  return getUserReactionVideos("getLikedVideos", params);
}

export async function getDislikedVideos(params: GetUserReactionVideosParams) {
  return getUserReactionVideos("getDislikedVideos", params);
}

//folow unfollow apis
export async function getFollowReaction(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number
) {
  const { data } = await http2.get(
    `bitmap/v1/followReaction/${creatorId}`,
    {
      params: {
        userserialnumber: userSerialNumber,
        creatorserialnumber: creatorSerialNumber,
      },
    }
  );

  return data;
}

export async function followCreator(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number
) {
  const { data } = await http2.post(
    `bitmap/v1/follow/${creatorId}`,
    {
      userSerialNumber,
      creatorSerialNumber,
    }
  );

  return data;
}

export async function unfollowCreator(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number
) {
  const { data } = await http2.post(
    `bitmap/v1/unfollow/${creatorId}`,
    {
      userSerialNumber,
      creatorSerialNumber,
    }
  );

  return data;
}

