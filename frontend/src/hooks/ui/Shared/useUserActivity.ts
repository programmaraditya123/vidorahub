"use client";

import { useEffect } from "react";

const API_URL = "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/useractivity";
// const API_URL = "http://localhost:4000/api/v1/useractivity"


// ✅ ID generator
const generateId = () => {
    return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const useUserActivity = () => {
    useEffect(() => {
        // ✅ userId (used as session key)
        let userId = localStorage.getItem("user_id");
        if (!userId) {
            userId = generateId();
            localStorage.setItem("user_id", userId);
        }

        // ✅ activityId (just for tracking, not cleared)
        let activityId = localStorage.getItem("activity_id");
        if (!activityId) {
            activityId = generateId();
            localStorage.setItem("activity_id", activityId);
        }

        let timeSpent = Number(localStorage.getItem("timespent") || 0);
        let lastActivityTime = Date.now();

        const markActive = () => {
            lastActivityTime = Date.now();
        };

        const events: (keyof WindowEventMap)[] = [
            "mousemove",
            "keydown",
            "scroll",
            "click",
        ];

        events.forEach((event) =>
            window.addEventListener(event, markActive)
        );

        // ✅ track active time
        const interval = setInterval(() => {
            const now = Date.now();
            const isIdle = now - lastActivityTime > 30000;

            if (!isIdle) {
                timeSpent += 5;
                localStorage.setItem("timespent", timeSpent.toString());
            }
        }, 5000);

        // ✅ send delta & reset time
        const sendData = () => {
            const currentTime = Number(localStorage.getItem("timespent") || 0);

            if (currentTime > 0) {
                navigator.sendBeacon(
                    API_URL,
                    new Blob(
                        [
                            JSON.stringify({
                                userId,
                                totalTimeSpent: currentTime,
                            }),
                        ],
                        { type: "application/json" }
                    )
                );

                // ✅ RESET ONLY TIME (important)
                localStorage.setItem("timespent", "0");
                timeSpent = 0;

                // console.log("📡 Sent:", currentTime);
            }
        };

        // ✅ AUTO SEND every 2 min
        const sendInterval = setInterval(() => {
            sendData();
        }, 15000);

        // ✅ send remaining on close
        const handleUnload = () => {
            sendData(); // no reload check needed now
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(interval);
            clearInterval(sendInterval);

            events.forEach((event) =>
                window.removeEventListener(event, markActive)
            );

            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);
};