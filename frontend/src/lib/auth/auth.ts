
import {http} from "@/src/lib/http" 

export type RegisterPayload = {
    email:string,
    name:string,
    password:string
}

export type RegisterResponse = {
    success:boolean,
    user?:{id:string,email:string,name:string},
    message?:string
}


export type LoginPayload = {
    email:string,
    password:string
}

export type LoginResponse = {
    success:boolean,
    token:string,
    message?:string,
    user?:{email:string,name:string},
}

export async function userRegister(payload:RegisterPayload){
    const {data} = await http.post<RegisterResponse>("api/v1/register",payload)
    return data

}

export async function userLogin(payload:LoginPayload){
    const {data} = await http.post<LoginResponse>("/api/v1/userlogin",payload)
    return data
}