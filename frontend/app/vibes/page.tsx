'use client'

import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar"
import UnderDevelopment from "@/src/components/UnderDevelopment/UnderDevelopment"
import { useState } from "react"


export default function vibesPage(){
    const [development,setDevelopment] = useState(1)
    return(
        <>
        <Sidebar/>
        {development ? <UnderDevelopment/> : 
        <>
        <h1>This is thevibes shorts page</h1>
        </>
        }
       
        </>
    )
}