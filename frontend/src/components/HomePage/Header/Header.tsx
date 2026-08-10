"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Header.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import { checkSession } from "@/src/lib/auth/auth";
import Image from "next/image";

const STARTER_SESSION_PREFIX = "vidorahub_home_starter_seen";
const OPEN_HOME_STARTER_EVENT = "vidorahub:open-home-starter";
const AUTH_CHANGED_EVENT = "vidorahub:auth-changed";

type AuthSnapshot = {
  token: string | null;
  profileName: string;
  profilePicUrl: string | null;
};

function getStoredValue(key: string) {
  try {
    const value = window.localStorage.getItem(key)?.trim();
    if (!value || value === "undefined" || value === "null") return null;
    return value;
  } catch {
    return null;
  }
}

function removeStoredValue(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}

function getAuthSnapshot(): AuthSnapshot {
  const token = getStoredValue("token");

  if (!token) {
    return {
      token: null,
      profileName: "Profile",
      profilePicUrl: null,
    };
  }

  return {
    token,
    profileName: getStoredValue("userName") || "Profile",
    profilePicUrl: getStoredValue("ppurl"),
  };
}

function clearHomeStarterSeenState() {
  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(STARTER_SESSION_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Session storage may be unavailable in private browsing or embedded contexts.
  }
}

export default function Header() {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthSnapshot>(() => {
    if (typeof window === "undefined") {
      return { token: null, profileName: "Profile", profilePicUrl: null };
    }

    return getAuthSnapshot();
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const isLoggedIn = Boolean(auth.token);
  const profileName = auth.profileName;
  const profilePicUrl = auth.profilePicUrl;
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "V";

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const refreshAuthSnapshot = () => {
    setAuth(getAuthSnapshot());
  };

  const openHomeStarter = () => {
    closeProfileMenu();
    clearHomeStarterSeenState();

    if (window.location.pathname === "/") {
      window.dispatchEvent(new Event(OPEN_HOME_STARTER_EVENT));
      return;
    }

    router.push("/");
  };

  const openSettings = () => {
    closeProfileMenu();
    router.push("/profile/setting");
  };

  const openLogin = () => {
    closeProfileMenu();
    router.push("/login");
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || ["token", "userName", "ppurl"].includes(event.key)) {
        refreshAuthSnapshot();
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshAuthSnapshot();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshAuthSnapshot);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuthSnapshot);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshAuthSnapshot);
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuthSnapshot);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!auth.token) {
      removeStoredValue("ppurl");
      return;
    }

    let ignore = false;

    async function syncSessionProfile() {
      try {
        const session = await checkSession();
        if (ignore) return;

        if (session.user?.name) {
          setStoredValue("userName", session.user.name);
        }

        if (session.user?.profilePicUrl) {
          setStoredValue("ppurl", session.user.profilePicUrl);
        } else {
          removeStoredValue("ppurl");
        }

        setAuth(getAuthSnapshot());
      } catch {
        if (ignore) return;
        setAuth(getAuthSnapshot());
      }
    }

    void syncSessionProfile();

    return () => {
      ignore = true;
    };
  }, [auth.token]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        profileMenuRef.current?.contains(target) ||
        profileButtonRef.current?.contains(target)
      ) {
        return;
      }

      setProfileMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  return (
    <header className={styles.header}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>

        <p className={styles.homeLogo}><VidorahubIcon.VidorahubIcon height={28} width={28} color="purple" /> VidoraHub</p>
      </div>

      {/* Right Actions */}
      <div className={styles.actions}>
        <div className={styles.profileMenuWrap}>
          <button
            ref={profileButtonRef}
            type="button"
            className={`${styles.iconBtn} ${styles.profileBtn} glass-dark`}
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
          >
            {!isLoggedIn ? (
              <span className="material-symbols-outlined" aria-hidden="true">
                account_circle
              </span>
            ) : profilePicUrl ? (
              <span
                className={styles.profileAvatar}
                style={{ backgroundImage: `url(${profilePicUrl})` }}
                aria-hidden="true"
              />
            ) : (
              <span className={styles.profileFallback} aria-hidden="true">
                {profileInitial}
              </span>
            )}
          </button>

          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              className={styles.profileDropdown}
              role="menu"
              aria-label="Profile menu"
            >
              {!isLoggedIn ? (
                <div className={styles.loginPrompt} role="none">
                  <span className={styles.loginPromptIcon}>
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </span>
                  <div>
                    <p>Unlock your VidoraHub space</p>
                    <small>
                      Login to switch profiles, create profiles, manage notifications and keep your experience synced.
                    </small>
                  </div>
                  <button type="button" role="menuitem" onClick={openLogin}>
                    <span className="material-symbols-outlined">login</span>
                    Login
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.profileSummary}>
                    {profilePicUrl && (
                      <Image
                        src={profilePicUrl}
                        alt="Profile"
                        width={38}
                        height={38}
                        className={styles.profileSummaryAvatar}
                      />
                    )}
                    <div>
                      <p>{profileName}</p>
                      <small>Manage your VidoraHub profile</small>
                    </div>
                  </div>

                  <button type="button" role="menuitem" onClick={openHomeStarter}>
                    <span className="material-symbols-outlined">switch_account</span>
                    Switch profile
                  </button>
                  <button type="button" role="menuitem" onClick={openHomeStarter}>
                    <span className="material-symbols-outlined">add_circle</span>
                    Create profile
                  </button>
                  <button type="button" role="menuitem" onClick={openSettings}>
                    <span className="material-symbols-outlined">notifications</span>
                    Notifications
                  </button>
                  <button type="button" role="menuitem" onClick={openSettings}>
                    <span className="material-symbols-outlined">settings</span>
                    Setting
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* <Link href={'https://about.vidorahub.com/'} target="_blank">
        <button className={`${styles.uploadBtn} glass-dark`}>
          {"About"}
        </button>
        </Link> */}

        <Link href={isLoggedIn ? 'upload' : 'login'}>
          <button className={`${styles.uploadBtn} glass-dark`}>
            {isLoggedIn ? "Upload" : "Login"}
          </button>
        </Link>

      </div>
    </header>
  );
}
