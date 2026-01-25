import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import React from "react";


export default function vibesLayout({children} : Readonly<{children : React.ReactNode}>){
    return (
    <>
    <Sidebar/>
    {children}
    </>
    )
}