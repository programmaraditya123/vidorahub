"use client";

import { useEffect, useRef } from "react";
import useUserCredential from "./useUserCredential";

const API_URL =
  "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/useractivity";

const IDLE_THRESHOLD_MS = 30_000;
const TRACK_INTERVAL_MS = 5_000;
const SEND_INTERVAL_MS = 15_000;
const TIME_INCREMENT_S = 5;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "scroll",
  "click",
];

// --------------------------------------------------
// Module-level state
// --------------------------------------------------

let trackInterval: ReturnType<typeof setInterval> | null = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;

let timeSpent = 0;
let lastActivityTime = Date.now();

const markActive = () => {
  lastActivityTime = Date.now();
};

// --------------------------------------------------
// Types
// --------------------------------------------------

interface ActivityCredentials {
  userId: string | null;
  profileId : string | null;
  sessionId: string;
  eventId: string;
  deviceId: string;
}

// --------------------------------------------------
// Send activity
// --------------------------------------------------

const sendData = (credentials: ActivityCredentials) => {
  if (timeSpent <= 0) return;

  const payload = {
    userId: credentials.userId,

    sessionId: credentials.sessionId,
    eventId: credentials.eventId,
    deviceId: credentials.deviceId,

    totalTimeSpent: timeSpent,
  };

  navigator.sendBeacon(
    API_URL,
    new Blob([JSON.stringify(payload)], {
      type: "application/json",
    })
  );

  timeSpent = 0;

  localStorage.setItem("timespent", "0");
};

// --------------------------------------------------
// Start tracking
// --------------------------------------------------

const startTracking = (credentials: ActivityCredentials) => {
  // Already running
  if (trackInterval || sendInterval) return;

  ACTIVITY_EVENTS.forEach((event) => {
    window.addEventListener(event, markActive, {
      passive: true,
    });
  });

  // -----------------------------------------------
  // Track active time
  // -----------------------------------------------

  trackInterval = setInterval(() => {
    const isIdle =
      Date.now() - lastActivityTime > IDLE_THRESHOLD_MS;

    if (isIdle) return;

    timeSpent += TIME_INCREMENT_S;

    localStorage.setItem(
      "timespent",
      String(timeSpent)
    );
  }, TRACK_INTERVAL_MS);

  // -----------------------------------------------
  // Send activity periodically
  // -----------------------------------------------

  sendInterval = setInterval(() => {
    sendData(credentials);
  }, SEND_INTERVAL_MS);

  // -----------------------------------------------
  // Flush when leaving page
  // -----------------------------------------------

  window.addEventListener("beforeunload", () => {
    sendData(credentials);
  });
};

// --------------------------------------------------
// Stop tracking
// --------------------------------------------------

const stopTracking = (credentials: ActivityCredentials) => {
  // Flush remaining activity
  sendData(credentials);

  if (trackInterval) {
    clearInterval(trackInterval);
    trackInterval = null;
  }

  if (sendInterval) {
    clearInterval(sendInterval);
    sendInterval = null;
  }

  ACTIVITY_EVENTS.forEach((event) => {
    window.removeEventListener(event, markActive);
  });
};

// --------------------------------------------------
// Hook
// --------------------------------------------------

export const useUserActivity = (): void => {
  const credentials = useUserCredential();

  const credentialsRef = useRef<ActivityCredentials | null>(null);

  useEffect(() => {
    if (!credentials.isInitialized) {
      return;
    }

    /**
     * userId should come from your JWT/authentication
     * system, NOT localStorage-generated IDs.
     *
     * Replace this with your actual authenticated user ID.
     */
    const userId = localStorage.getItem("userId") ?? null;

    const profile_id = localStorage.getItem("activeProfileId") ?? null;

    if (
      !credentials.sessionId ||
      !credentials.eventId ||
      !credentials.deviceId
    ) {
      return;
    }

    const activityCredentials: ActivityCredentials = {
      userId,
      profileId : profile_id,
      sessionId: credentials.sessionId,
      eventId: credentials.eventId,
      deviceId: credentials.deviceId,
    };

    credentialsRef.current = activityCredentials;

    timeSpent = Number(
      localStorage.getItem("timespent") ?? 0
    );

    lastActivityTime = Date.now();

    startTracking(activityCredentials);

    return () => {
      if (credentialsRef.current) {
        stopTracking(credentialsRef.current);
      }

      credentialsRef.current = null;
    };
  }, [
    credentials.isInitialized,
    credentials.sessionId,
    credentials.eventId,
    credentials.deviceId,
  ]);
};


// "use client";

// import { useEffect, useRef } from "react";

// const API_URL = "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/useractivity";

// const IDLE_THRESHOLD_MS = 30_000;
// const TRACK_INTERVAL_MS = 5_000;
// const SEND_INTERVAL_MS = 15_000;
// const TIME_INCREMENT_S = 5;

// const generateId = (): string =>
//   crypto.randomUUID?.() ??
//   "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
//   });

// const getOrCreateId = (key: string): string => {
//   let id = localStorage.getItem(key);
//   if (!id) {
//     id = generateId();
//     localStorage.setItem(key, id);
//   }
//   return id;
// };

// const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "scroll", "click"];

// // ✅ Module-level state — not affected by React re-renders or Strict Mode
// let trackInterval: ReturnType<typeof setInterval> | null = null;
// let sendInterval: ReturnType<typeof setInterval> | null = null;
// let timeSpent = 0;
// let lastActivityTime = Date.now();

// const markActive = () => {
//   lastActivityTime = Date.now();
// };

// const sendData = (userId: string) => {
//   if (timeSpent <= 0) return;

//   navigator.sendBeacon(
//     API_URL,
//     new Blob([JSON.stringify({ userId, totalTimeSpent: timeSpent })], {
//       type: "application/json",
//     })
//   );

//   timeSpent = 0;
//   localStorage.setItem("timespent", "0");
// };

// const startTracking = (userId: string) => {
//   // ✅ Already running — don't double-register
//   if (trackInterval || sendInterval) return;

//   ACTIVITY_EVENTS.forEach((e) =>
//     window.addEventListener(e, markActive, { passive: true })
//   );

//   trackInterval = setInterval(() => {
//     const isIdle = Date.now() - lastActivityTime > IDLE_THRESHOLD_MS;
//     if (isIdle) return;

//     timeSpent += TIME_INCREMENT_S;
//     localStorage.setItem("timespent", String(timeSpent));
//   }, TRACK_INTERVAL_MS);

//   sendInterval = setInterval(() => sendData(userId), SEND_INTERVAL_MS);

//   window.addEventListener("beforeunload", () => sendData(userId));
// };

// const stopTracking = (userId: string) => {
//   sendData(userId); // flush before stopping

//   if (trackInterval) { clearInterval(trackInterval); trackInterval = null; }
//   if (sendInterval) { clearInterval(sendInterval); sendInterval = null; }

//   ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
// };

// export const useUserActivity = (): void => {
//   const userIdRef = useRef<string | null>(null);

//   useEffect(() => {
//     userIdRef.current = getOrCreateId("user_id");
//     getOrCreateId("activity_id");

//     timeSpent = Number(localStorage.getItem("timespent") ?? 0);

//     startTracking(userIdRef.current);

//     return () => {
//       if (userIdRef.current) stopTracking(userIdRef.current);
//     };
//   }, []);
// };