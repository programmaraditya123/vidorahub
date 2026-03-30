"use client";

import { useEffect, useRef } from "react";

const API_URL = "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/useractivity";

const IDLE_THRESHOLD_MS = 30_000;
const TRACK_INTERVAL_MS = 5_000;
const SEND_INTERVAL_MS = 15_000;
const TIME_INCREMENT_S = 5;

const generateId = (): string =>
  crypto.randomUUID?.() ??
  "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const getOrCreateId = (key: string): string => {
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
};

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "scroll", "click"];

// ✅ Module-level state — not affected by React re-renders or Strict Mode
let trackInterval: ReturnType<typeof setInterval> | null = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;
let timeSpent = 0;
let lastActivityTime = Date.now();

const markActive = () => {
  lastActivityTime = Date.now();
};

const sendData = (userId: string) => {
  if (timeSpent <= 0) return;

  navigator.sendBeacon(
    API_URL,
    new Blob([JSON.stringify({ userId, totalTimeSpent: timeSpent })], {
      type: "application/json",
    })
  );

  timeSpent = 0;
  localStorage.setItem("timespent", "0");
};

const startTracking = (userId: string) => {
  // ✅ Already running — don't double-register
  if (trackInterval || sendInterval) return;

  ACTIVITY_EVENTS.forEach((e) =>
    window.addEventListener(e, markActive, { passive: true })
  );

  trackInterval = setInterval(() => {
    const isIdle = Date.now() - lastActivityTime > IDLE_THRESHOLD_MS;
    if (isIdle) return;

    timeSpent += TIME_INCREMENT_S;
    localStorage.setItem("timespent", String(timeSpent));
  }, TRACK_INTERVAL_MS);

  sendInterval = setInterval(() => sendData(userId), SEND_INTERVAL_MS);

  window.addEventListener("beforeunload", () => sendData(userId));
};

const stopTracking = (userId: string) => {
  sendData(userId); // flush before stopping

  if (trackInterval) { clearInterval(trackInterval); trackInterval = null; }
  if (sendInterval) { clearInterval(sendInterval); sendInterval = null; }

  ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
};

export const useUserActivity = (): void => {
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = getOrCreateId("user_id");
    getOrCreateId("activity_id");

    timeSpent = Number(localStorage.getItem("timespent") ?? 0);

    startTracking(userIdRef.current);

    return () => {
      if (userIdRef.current) stopTracking(userIdRef.current);
    };
  }, []);
};



// "use client";

// import { useEffect } from "react";

// const API_URL = "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/useractivity";
// // const API_URL = "http://localhost:4000/api/v1/useractivity"


// // ✅ ID generator
// const generateId = () => {
//     return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//         const r = (Math.random() * 16) | 0;
//         const v = c === "x" ? r : (r & 0x3) | 0x8;
//         return v.toString(16);
//     });
// };

// export const useUserActivity = () => {
//     useEffect(() => {
//         // ✅ userId (used as session key)
//         let userId = localStorage.getItem("user_id");
//         if (!userId) {
//             userId = generateId();
//             localStorage.setItem("user_id", userId);
//         }

//         // ✅ activityId (just for tracking, not cleared)
//         let activityId = localStorage.getItem("activity_id");
//         if (!activityId) {
//             activityId = generateId();
//             localStorage.setItem("activity_id", activityId);
//         }

//         let timeSpent = Number(localStorage.getItem("timespent") || 0);
//         let lastActivityTime = Date.now();

//         const markActive = () => {
//             lastActivityTime = Date.now();
//         };

//         const events: (keyof WindowEventMap)[] = [
//             "mousemove",
//             "keydown",
//             "scroll",
//             "click",
//         ];

//         events.forEach((event) =>
//             window.addEventListener(event, markActive)
//         );

//         // ✅ track active time
//         const interval = setInterval(() => {
//             const now = Date.now();
//             const isIdle = now - lastActivityTime > 30000;

//             if (!isIdle) {
//                 timeSpent += 5;
//                 localStorage.setItem("timespent", timeSpent.toString());
//             }
//         }, 5000);

//         // ✅ send delta & reset time
//         const sendData = () => {
//             const currentTime = Number(localStorage.getItem("timespent") || 0);

//             if (currentTime > 0) {
//                 navigator.sendBeacon(
//                     API_URL,
//                     new Blob(
//                         [
//                             JSON.stringify({
//                                 userId,
//                                 totalTimeSpent: currentTime,
//                             }),
//                         ],
//                         { type: "application/json" }
//                     )
//                 );

//                 // ✅ RESET ONLY TIME (important)
//                 localStorage.setItem("timespent", "0");
//                 timeSpent = 0;

//                 // console.log("📡 Sent:", currentTime);
//             }
//         };

//         // ✅ AUTO SEND every 2 min
//         const sendInterval = setInterval(() => {
//             sendData();
//         }, 15000);

//         // ✅ send remaining on close
//         const handleUnload = () => {
//             sendData(); // no reload check needed now
//         };

//         window.addEventListener("beforeunload", handleUnload);

//         return () => {
//             clearInterval(interval);
//             clearInterval(sendInterval);

//             events.forEach((event) =>
//                 window.removeEventListener(event, markActive)
//             );

//             window.removeEventListener("beforeunload", handleUnload);
//         };
//     }, []);
// };