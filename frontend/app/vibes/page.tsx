"use client";

import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import UnderDevelopment from "@/src/components/UnderDevelopment/UnderDevelopment";
import { useState } from "react";
import styles from './vibes.module.scss'


export default function VibesPage() {
  const [development, setDevelopment] = useState(0);

  return (
    <>
      <Sidebar />
      {development ? (
        <UnderDevelopment />
      ) : (
        <>
        <div className={styles.divCenter}>
            <h1>Hello</h1>
        </div>
          
        </>
      )}
    </>
  );
}
