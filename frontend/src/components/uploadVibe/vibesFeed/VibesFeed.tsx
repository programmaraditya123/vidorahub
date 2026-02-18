"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import styles from "./VibesFeed.module.scss";
import { http } from "@/src/lib/http";

interface VibeItem {
  _id: string;
  videoUrl: string;
  uploader: {
    name: string;
  };
}

export default function VibesFeed() {
  const [vibes, setVibes] = useState<VibeItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadVibes();
  }, []);

  const loadVibes = async () => {
    const res = await http.get("/api/v1/allvibes?limit=10");
    setVibes(res.data.items);
  };

  return (
    <div className={styles.page}>
      <Sidebar />

      <div ref={containerRef} className={styles.feed}>
        {vibes.map((vibe) => (
          <div key={vibe._id} className={styles.vibeCard}>
            <video
              className={styles.video}
              src={vibe.videoUrl}
              autoPlay
              muted
              loop
              playsInline
            />

            <div className={styles.overlay}>
              <div className={styles.meta}>
                <h4>@{vibe.uploader?.name}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
