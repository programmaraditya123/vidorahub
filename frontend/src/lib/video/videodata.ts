import { http } from "../http";


export async function getVideoMetadataExceptCommentsDocs (vedioId : string){
    const vedioMetaData = await http.get(`api/v1/getVedioDataExceptCommentsDocs/${vedioId}`)
    return vedioMetaData
}
