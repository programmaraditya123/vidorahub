import Navbar2 from "@/src/components/Navbar2/Navbar2";
import React from "react";

export default function VideoPage({children}:Readonly<{children:React.ReactNode}>){
    return(
        <>
        <Navbar2/>
         {children}
        </>        
    )
}