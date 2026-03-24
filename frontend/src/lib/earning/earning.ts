import { http } from "../http";


export async function getEarning () {
    const getCreatorEarning = await http.get('/api/v1/getEarnings')
    return getCreatorEarning?.data

}