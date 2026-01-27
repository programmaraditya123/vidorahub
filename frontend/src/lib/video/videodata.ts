import { http } from "../http";


export async function getVideoMetadataExceptCommentsDocs (vedioId : string){
    const vedioMetaData = await http.get(`api/v1/getVedioDataExceptCommentsDocs/${vedioId}`)
    return vedioMetaData
}

interface GetNextVideosParams {
  videoId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getNextVideos({
  videoId,
  page = 1,
  limit = 10,
  search = "",
}: GetNextVideosParams) {
  const res = await http.get("/api/v1/getNextVideos", {
    params: {
      excludeVideoId: videoId,
      page,
      limit,
      search,
    },
  });

  return res.data;
}


export async function getCreatorProfileData(){
  const creatorData = await http.get('/api/v1/creatorProfile')

  return creatorData?.data

}

export async function creatorDeleteVideo (videoId : string) {
  const deleteVideo = await http.put('/api/v1/deletevideo',{
    videoId: videoId,  
  })

  return deleteVideo
}

 

type PostViewPayload = {
  videoId: string;
  sessionId: string;
  watchTime: number;
};

export async function postView(payload: PostViewPayload) {
  const response = await http.post("/api/v1/views", payload);
  return response.data;
}
