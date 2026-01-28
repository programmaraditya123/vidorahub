"use client";

import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import UnderDevelopment from "@/src/components/UnderDevelopment/UnderDevelopment";
import { useState } from "react";

// export const metadata = {
//   title: "Watch Short Videos – Vibes by VidoraHub",
//   description:
//     "Watch short videos, trending reels and viral clips on Vibes by VidoraHub. A new way to explore creators, stories and entertainment in seconds."
// };

export default function VibesPage() {
  const [development, setDevelopment] = useState(1);

  return (
    <>
      <Sidebar />
      {development ? (
        <UnderDevelopment />
      ) : (
        <>
          <h1>Vibes – Short Videos on VidoraHub</h1>
          <p>
            Vibes is VidoraHub’s short-form video experience where you can watch
            quick, creative and trending videos from creators around the world.
          </p>
        </>
      )}
    </>
  );
}
