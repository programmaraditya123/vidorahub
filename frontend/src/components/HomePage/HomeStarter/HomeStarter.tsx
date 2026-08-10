"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { checkSession, type SessionUser } from "@/src/lib/auth/auth";
import {
  createAccountProfile,
  getAccountProfiles,
  switchAccountProfile,
  type AccountProfile,
} from "@/src/lib/accountprofiles/accountprofiles";
import ProfileDatePicker from "@/src/components/shared/ProfileDatePicker/ProfileDatePicker";
import styles from "./HomeStarter.module.scss";

const STARTER_SESSION_PREFIX = "vidorahub_home_starter_seen";
const ACTIVE_PROFILE_STORAGE_KEY = "activeProfileId";
const OPEN_HOME_STARTER_EVENT = "vidorahub:open-home-starter";

type StarterMode = "checking" | "guest" | "profiles" | "hidden";

function getStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}

function getSessionValue(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function hasSeenProfileStarter() {
  try {
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(`${STARTER_SESSION_PREFIX}:`) && key !== `${STARTER_SESSION_PREFIX}:guest`) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function hasActiveProfile() {
  return Boolean(getStoredValue(ACTIVE_PROFILE_STORAGE_KEY));
}

function getInitialMode(): StarterMode {
  if (typeof window === "undefined") return "hidden";

  const token = getStoredValue("token");
  if (!token) {
    return getSessionValue(`${STARTER_SESSION_PREFIX}:guest`) ? "hidden" : "checking";
  }

  return hasActiveProfile() || hasSeenProfileStarter() ? "hidden" : "checking";
}

function setSessionValue(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}

function removeStoredValue(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function getAccountKey(user?: SessionUser | null) {
  const userId = user?._id || user?.id;
  const storedSerial = getStoredValue("userSerialNumber");
  const storedName = getStoredValue("userName");
  return userId || storedSerial || user?.email || user?.name || storedName || "signed-in";
}

export default function HomeStarter() {
  const router = useRouter();
  const [mode, setMode] = useState<StarterMode>(getInitialMode);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDateOfBirth, setCreateDateOfBirth] = useState("");
  const [createAsPrimary, setCreateAsPrimary] = useState(false);

  const starterKey = useMemo(() => {
    if (mode === "guest") return `${STARTER_SESSION_PREFIX}:guest`;
    if (mode === "profiles") return `${STARTER_SESSION_PREFIX}:${getAccountKey(sessionUser)}`;
    return "";
  }, [mode, sessionUser]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile._id === selectedProfileId),
    [profiles, selectedProfileId],
  );

  const markSeenAndHide = useCallback(() => {
    if (starterKey) {
      setSessionValue(starterKey, "true");
    }
    setMode("hidden");
  }, [starterKey]);

  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    setError("");

    try {
      const response = await getAccountProfiles();
      const nextProfiles = Array.isArray(response.data) ? response.data : [];
      const storedProfileId = getStoredValue(ACTIVE_PROFILE_STORAGE_KEY);
      const nextSelectedProfileId =
        nextProfiles.find((profile) => profile._id === storedProfileId)?._id ||
        nextProfiles.find((profile) => profile.isActive)?._id ||
        nextProfiles.find((profile) => profile.isPrimary)?._id ||
        nextProfiles[0]?._id ||
        "";

      setProfiles(nextProfiles);
      setSelectedProfileId(nextSelectedProfileId);
    } catch (profileError) {
      setProfiles([]);
      setSelectedProfileId("");
      setError(getErrorMessage(profileError, "Unable to load profiles."));
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const resolveStarter = useCallback(
    async (options?: { forceProfiles?: boolean }) => {
      const token = getStoredValue("token");

      if (!token) {
        if (!options?.forceProfiles && getSessionValue(`${STARTER_SESSION_PREFIX}:guest`)) {
          setMode("hidden");
          return;
        }

        setMode("guest");
        return;
      }

      if (!options?.forceProfiles && (hasActiveProfile() || hasSeenProfileStarter())) {
        setMode("hidden");
        return;
      }

      setMode("checking");
      setError("");
      setCreateOpen(false);

      try {
        const session = await checkSession();

        const user = session.user || null;
        const accountStarterKey = `${STARTER_SESSION_PREFIX}:${getAccountKey(user)}`;

        if (user?.profilePicUrl) {
          setStoredValue("ppurl", user.profilePicUrl);
        }

        if (user?.name) {
          setStoredValue("userName", user.name);
        }

        if (!options?.forceProfiles && getSessionValue(accountStarterKey)) {
          setMode("hidden");
          return;
        }

        setSessionUser(user);
        setMode("profiles");
        await loadProfiles();
      } catch (sessionError) {
        const message = getErrorMessage(sessionError, "");
        const normalizedMessage = message.toLowerCase();

        if (
          normalizedMessage.includes("expired") ||
          normalizedMessage.includes("invalid") ||
          normalizedMessage.includes("token") ||
          normalizedMessage.includes("user not found")
        ) {
          removeStoredValue("token");
          removeStoredValue("userName");
          removeStoredValue("userSerialNumber");
          removeStoredValue(ACTIVE_PROFILE_STORAGE_KEY);
        }

        if (!options?.forceProfiles && getSessionValue(`${STARTER_SESSION_PREFIX}:guest`)) {
          setMode("hidden");
          return;
        }

        setMode("guest");
      }
    },
    [loadProfiles],
  );

  useEffect(() => {
    let ignore = false;

    async function runInitialResolve() {
      await resolveStarter();
    }

    if (!ignore) {
      runInitialResolve();
    }

    return () => {
      ignore = true;
    };
  }, [resolveStarter]);

  useEffect(() => {
    const handleOpenHomeStarter = () => {
      void resolveStarter({ forceProfiles: true });
    };

    window.addEventListener(OPEN_HOME_STARTER_EVENT, handleOpenHomeStarter);
    return () => window.removeEventListener(OPEN_HOME_STARTER_EVENT, handleOpenHomeStarter);
  }, [resolveStarter]);

  const handleLogin = () => {
    setSessionValue(`${STARTER_SESSION_PREFIX}:guest`, "true");
    window.sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    router.push("/login");
  };

  const handleExploreAsGuest = () => {
    setSessionValue(`${STARTER_SESSION_PREFIX}:guest`, "true");
    setMode("hidden");
  };

  const handleSwitchProfile = async () => {
    if (!selectedProfileId) {
      setError("Choose a profile first.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await switchAccountProfile(selectedProfileId);
      const switchedProfile = response.data;

      setProfiles((currentProfiles) =>
        currentProfiles.map((profile) => ({
          ...profile,
          isActive: profile._id === switchedProfile._id,
        })),
      );
      setStoredValue(ACTIVE_PROFILE_STORAGE_KEY, switchedProfile._id);
      markSeenAndHide();
    } catch (switchError) {
      setError(getErrorMessage(switchError, "Unable to switch profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = createName.trim();
    if (!normalizedName) {
      setError("Profile name is required.");
      return;
    }

    if (
      profiles.some(
        (profile) => profile.name.trim().toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      setError("A profile with this name already exists.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await createAccountProfile({
        name: normalizedName,
        dateOfBirth: createDateOfBirth || undefined,
        isPrimary: createAsPrimary,
      });
      const createdProfile = response.data;

      setProfiles((currentProfiles) => {
        const normalizedProfiles = createAsPrimary
          ? currentProfiles.map((profile) => ({ ...profile, isPrimary: false }))
          : currentProfiles;

        return [...normalizedProfiles, createdProfile];
      });
      setSelectedProfileId(createdProfile._id);
      setStoredValue(ACTIVE_PROFILE_STORAGE_KEY, createdProfile._id);
      setCreateName("");
      setCreateDateOfBirth("");
      setCreateAsPrimary(false);
      setCreateOpen(false);
    } catch (createError) {
      setError(getErrorMessage(createError, "Unable to create profile."));
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "hidden") return null;

  if (mode === "checking") {
    return null;
  }

  if (mode === "guest") {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <section className={`${styles.panel} ${styles.watchPanel}`}>
          <div className={styles.brandMark}>VidoraHub</div>
          <div className={styles.badgeRow}>
            <span className={styles.guestBadge}>Guest</span>
          </div>

          <h2>Who&apos;s watching?</h2>
          <p className={styles.copy}>
            Login to continue with profiles, recommendations and saved preferences.
          </p>

          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={handleExploreAsGuest}>
              Explore as guest
            </button>
            <button className={styles.primaryButton} onClick={handleLogin}>
              Login
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <section className={`${styles.panel} ${styles.watchPanel}`}>
        <div className={styles.brandMark}>VidoraHub</div>
        <div className={styles.badgeRow}>
          <span className={styles.accountBadge}>
            {sessionUser?.name || getStoredValue("userName") || "Signed in"}
          </span>
        </div>

        <h2>Who&apos;s watching?</h2>
        <p className={styles.copy}>
          Choose a profile to start watching.
        </p>

        {error && (
          <div className={styles.notice}>
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.profileGrid} aria-busy={isLoadingProfiles}>
          {isLoadingProfiles ? (
            <div className={styles.emptyState}>Loading profiles...</div>
          ) : (
            profiles.map((profile) => {
              const selected = profile._id === selectedProfileId;
              const avatarLabel = profile.name.trim().charAt(0).toUpperCase() || "V";

              return (
                <button
                  key={profile._id}
                  className={`${styles.profileCard} ${selected ? styles.selectedProfile : ""}`}
                  onClick={() => setSelectedProfileId(profile._id)}
                  aria-pressed={selected}
                >
                  <span
                    className={styles.avatar}
                    style={
                      profile.profilePicUrl
                        ? { backgroundImage: `url(${profile.profilePicUrl})` }
                        : undefined
                    }
                  >
                    {!profile.profilePicUrl && avatarLabel}
                  </span>
                  <strong>{profile.name}</strong>
                  <small>
                    {profile.isPrimary
                      ? "Primary"
                      : profile.isKidsProfile
                        ? "Kids"
                        : profile.profileType || "Profile"}
                  </small>
                  {(selected || profile.isActive) && (
                    <span className={styles.checkIcon}>
                      <span className="material-symbols-outlined">check_circle</span>
                    </span>
                  )}
                </button>
              );
            })
          )}

          {!isLoadingProfiles && (
            <button
              className={`${styles.profileCard} ${styles.addProfileCard}`}
              onClick={() => setCreateOpen((current) => !current)}
              aria-expanded={createOpen}
            >
              <span className={styles.addAvatar}>
                <span className="material-symbols-outlined">add</span>
              </span>
              <strong>Create profile</strong>
              <small>Add profile</small>
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleSwitchProfile}
            disabled={isSaving || isLoadingProfiles || !activeProfile}
          >
            {isSaving ? "Saving..." : activeProfile ? "Continue" : "Choose profile"}
          </button>
        </div>
      </section>

      {createOpen && (
        <div className={styles.createModalOverlay} role="dialog" aria-modal="true">
          <form className={styles.createModal} onSubmit={handleCreateProfile}>
            <div className={styles.createModalHeader}>
              <div>
                <h3>Create profile</h3>
                <p>Add a new watching profile for this account.</p>
              </div>
              <button
                type="button"
                className={styles.createModalClose}
                onClick={() => setCreateOpen(false)}
                aria-label="Close create profile"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <label>
              <span>Name</span>
              <input
                value={createName}
                maxLength={40}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Profile name"
                autoFocus
              />
            </label>

            <ProfileDatePicker
              value={createDateOfBirth}
              max={new Date().toISOString().split("T")[0]}
              onChange={setCreateDateOfBirth}
              tone="dark"
            />

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={createAsPrimary}
                onChange={(event) => setCreateAsPrimary(event.target.checked)}
              />
              <span>Make primary</span>
            </label>

            <div className={styles.createModalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button className={styles.primaryButton} disabled={isSaving} type="submit">
                {isSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
