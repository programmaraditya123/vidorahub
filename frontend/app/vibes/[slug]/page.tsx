"use client";

import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
// import UnderDevelopment from "@/src/components/UnderDevelopment/UnderDevelopment";
import styles from "../vibes.module.scss";
// import VibesFeed from "@/src/components/uploadVibe/vibesFeed/VibesFeed";
import ThreeVibesFeed from "@/src/components/uploadVibe/vibesFeed/ThreeVibesFeed/ThreeVibesFeed";
import { Suspense } from "react";

export default function VibesPage() {

  return (
    <>
      <Sidebar />

      <div className={styles.divCenter}>
        {/* <VibesFeed /> */}
          <Suspense fallback={null}>
          <ThreeVibesFeed />
        </Suspense>
      </div>
    </>
  );
}
