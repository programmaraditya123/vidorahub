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

export interface VideoReactionsResponse {
  success: boolean;
  liked: boolean;
  disliked: boolean;
  likes: number;
  dislikes: number;
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


// export async function validateLikeDislike(
//   userSerialNumber: number,
//   videoSerialNumber: number
// ) {
//   const { data } = await http2.get<ValidateReactionResponse>(
//     "bitmap/v1/validateLikeDislike",
//     {
//       params: { userSerialNumber, videoSerialNumber },
//     }
//   );

//   return data;
// }

export async function getVideoReactions(
  userSerialNumber: number,
  videoSerialNumber: number
) {
  const { data } = await http2.get<VideoReactionsResponse>(
    "bitmap/v1/reactions",
    {
      params: { userSerialNumber, videoSerialNumber },
    }
  );

  return data;
}

