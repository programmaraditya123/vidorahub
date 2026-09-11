"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Header.module.scss";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import { checkSession } from "@/src/lib/auth/auth";
import Image from "next/image";
import { http } from "@/src/lib/http";

const STARTER_SESSION_PREFIX = "vidorahub_home_starter_seen";
const OPEN_HOME_STARTER_EVENT = "vidorahub:open-home-starter";
const AUTH_CHANGED_EVENT = "vidorahub:auth-changed";
const SEARCH_DRAFT_KEY = "vidorahub_search_draft";

type AuthSnapshot = {
  token: string | null;
  profileName: string;
  profilePicUrl: string | null;
};

type KeywordResponse = {
  success: boolean;
  keywords: string[];
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

function isCanceledRequest(error: unknown) {
  if (!error || typeof error !== "object" || !("raw" in error)) return false;

  const rawError = error.raw;

  return (
    rawError !== null &&
    typeof rawError === "object" &&
    "code" in rawError &&
    rawError.code === "ERR_CANCELED"
  );
}

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("search_query");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [auth, setAuth] = useState<AuthSnapshot>(() => {
    if (typeof window === "undefined") {
      return { token: null, profileName: "Profile", profilePicUrl: null };
    }

    return getAuthSnapshot();
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const isLoggedIn = Boolean(auth.token);
  const profileName = auth.profileName;
  const profilePicUrl = auth.profilePicUrl;
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "V";

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const updateSearchQuery = (value: string) => {
    setSearchQuery(value);
    try {
      window.sessionStorage.setItem(SEARCH_DRAFT_KEY, value);
    } catch {
      // Keep the input usable when session storage is unavailable.
    }
  };

  useEffect(() => {
    // URL searches take precedence on refresh and back/forward navigation.
    // Pages without a search parameter retain the user's last input.
    if (urlQuery !== null) {
      updateSearchQuery(urlQuery);
      return;
    }
    try {
      const draft = window.sessionStorage.getItem(SEARCH_DRAFT_KEY);
      if (draft !== null) setSearchQuery(draft);
    } catch {
      // Keep the current input when session storage is unavailable.
    }
  }, [urlQuery]);

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

  const openSettings = (panel?: string) => {
    closeProfileMenu();
    router.push(panel ? `/profile/setting?panel=${panel}` : "/profile/setting");
  };

  const openLogin = () => {
    closeProfileMenu();
    router.push("/login");
  };

  const submitSearch = (query: string) => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) return;

    updateSearchQuery(normalizedQuery);
    setKeywordsOpen(false);
    router.push(`/results?search_query=${encodeURIComponent(normalizedQuery)}`);
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

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      setKeywords([]);
      setKeywordsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await http.get<KeywordResponse>("/api/v1/keywords", {
          params: { q: normalizedQuery },
          signal: controller.signal,
        });

        const nextKeywords = Array.isArray(response.data.keywords)
          ? response.data.keywords
          : [];

        if (controller.signal.aborted) return;
        setKeywords(nextKeywords);
        setKeywordsOpen(nextKeywords.length > 0 && searchRef.current?.contains(document.activeElement) === true);
      } catch (error) {
        if (!isCanceledRequest(error)) {
          setKeywords([]);
          setKeywordsOpen(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current?.contains(event.target as Node)) return;
      setKeywordsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.searchContainer}>
        <Link href="/" className={styles.homeLogo} aria-label="VidoraHub home">
          <VidorahubIcon.VidorahubIcon height={28} width={28} color="purple" /> VidoraHub
        </Link>
      </div>

      <form
        ref={searchRef}
        className={styles.desktopSearch}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(searchQuery);
        }}
      >
        <span className={styles.searchIcon}>
          <VidorahubIcon.SearchIcon width={18} height={18} />
        </span>
        <input
          className={styles.searchInput}
          value={searchQuery}
          onChange={(event) => updateSearchQuery(event.target.value)}
          onFocus={() => setKeywordsOpen(keywords.length > 0)}
          placeholder="Search videos, creators, AI tools..."
          type="text"
          aria-label="Search videos, creators, AI tools"
          enterKeyHint="search"
          autoComplete="off"
        />

        {searchQuery && (
          <button
            className={styles.clearSearch}
            type="button"
            aria-label="Clear search"
            onClick={() => {
              updateSearchQuery("");
              setKeywords([]);
              setKeywordsOpen(false);
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}

        {keywordsOpen && (
          <div className={styles.keywordMenu}>
            {keywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  submitSearch(keyword);
                }}
              >
                <span className="material-symbols-outlined">search</span>
                {keyword}
              </button>
            ))}
          </div>
        )}
      </form>

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
              <Image
                src={profilePicUrl}
                alt="Profile"
                width={38}
                height={38}
                className={styles.profileAvatar}
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
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openSettings("notifications")}
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    Notifications
                  </button>
                  <button type="button" role="menuitem" onClick={() => openSettings()}>
                    <span className="material-symbols-outlined">settings</span>
                    Setting
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <Link href={isLoggedIn ? 'upload' : 'login'}>
          <button className={`${styles.uploadBtn} glass-dark`}>
            {isLoggedIn ? "Upload" : "Login"}
          </button>
        </Link>

      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
