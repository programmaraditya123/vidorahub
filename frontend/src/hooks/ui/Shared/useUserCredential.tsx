"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEYS = {
  SESSION_ID: "vidorahub_session_id",
  SESSION_CREATED_AT: "vidorahub_session_created_at",
  EVENT_ID: "vidorahub_event_id",
  DEVICE_ID: "vidorahub_device_id",
} as const;

const SESSION_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours

interface UserCredential {
  sessionId: string | null;
  eventId: string | null;
  deviceId: string | null;
  isInitialized: boolean;

  /**
   * Generates and stores a new event ID.
   * Use this whenever you want to track a new event.
   */
  generateEventId: () => string | null;

  /**
   * Returns the current credentials directly from localStorage.
   */
  getCredentials: () => {
    sessionId: string | null;
    eventId: string | null;
    deviceId: string | null;
  };
}

/**
 * Generate a cryptographically strong unique ID.
 */
const generateId = (prefix: string): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 15)}`;
};

/**
 * Universal user credential hook for VidoraHub.
 *
 * Handles:
 * - Persistent device ID
 * - 6-hour session ID
 * - Event ID
 * - localStorage persistence
 */
export const useUserCredential = (): UserCredential => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize credentials.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const now = Date.now();

      // -----------------------------------------
      // DEVICE ID
      // -----------------------------------------

      let storedDeviceId = localStorage.getItem(
        STORAGE_KEYS.DEVICE_ID
      );

      if (!storedDeviceId) {
        storedDeviceId = generateId("device");

        localStorage.setItem(
          STORAGE_KEYS.DEVICE_ID,
          storedDeviceId
        );
      }

      // -----------------------------------------
      // SESSION ID
      // -----------------------------------------

      let storedSessionId = localStorage.getItem(
        STORAGE_KEYS.SESSION_ID
      );

      const storedSessionCreatedAt = localStorage.getItem(
        STORAGE_KEYS.SESSION_CREATED_AT
      );

      const sessionCreatedAt = storedSessionCreatedAt
        ? Number(storedSessionCreatedAt)
        : 0;

      const sessionExpired =
        !storedSessionId ||
        !sessionCreatedAt ||
        now - sessionCreatedAt >= SESSION_EXPIRY;

      if (sessionExpired) {
        storedSessionId = generateId("session");

        localStorage.setItem(
          STORAGE_KEYS.SESSION_ID,
          storedSessionId
        );

        localStorage.setItem(
          STORAGE_KEYS.SESSION_CREATED_AT,
          now.toString()
        );
      }

      // -----------------------------------------
      // EVENT ID
      // -----------------------------------------

      let storedEventId = localStorage.getItem(
        STORAGE_KEYS.EVENT_ID
      );

      if (!storedEventId) {
        storedEventId = generateId("event");

        localStorage.setItem(
          STORAGE_KEYS.EVENT_ID,
          storedEventId
        );
      }

      // -----------------------------------------
      // UPDATE STATE
      // -----------------------------------------

      setDeviceId(storedDeviceId);
      setSessionId(storedSessionId);
      setEventId(storedEventId);

      setIsInitialized(true);
    } catch (error) {
      console.error(
        "Failed to initialize user credentials:",
        error
      );

      setIsInitialized(true);
    }
  }, []);

  /**
   * Generate a completely new event ID.
   */
  const generateEventId = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const newEventId = generateId("event");

    localStorage.setItem(
      STORAGE_KEYS.EVENT_ID,
      newEventId
    );

    setEventId(newEventId);

    return newEventId;
  }, []);

  /**
   * Get credentials directly from localStorage.
   */
  const getCredentials = useCallback(() => {
    if (typeof window === "undefined") {
      return {
        sessionId: null,
        eventId: null,
        deviceId: null,
      };
    }

    return {
      sessionId: localStorage.getItem(
        STORAGE_KEYS.SESSION_ID
      ),

      eventId: localStorage.getItem(
        STORAGE_KEYS.EVENT_ID
      ),

      deviceId: localStorage.getItem(
        STORAGE_KEYS.DEVICE_ID
      ),
    };
  }, []);

  return {
    sessionId,
    eventId,
    deviceId,
    isInitialized,
    generateEventId,
    getCredentials,
  };
};

export default useUserCredential;