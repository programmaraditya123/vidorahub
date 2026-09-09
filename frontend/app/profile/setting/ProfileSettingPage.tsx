"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/src/components/ProfilePage/Header";
import Footer from "@/src/components/ProfilePage/Footer";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import ProfileDatePicker from "@/src/components/shared/ProfileDatePicker/ProfileDatePicker";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import {
  createAccountProfile,
  getAccountProfiles,
  switchAccountProfile,
  type AccountProfile,
} from "@/src/lib/accountprofiles/accountprofiles";
import { getCreatorProfileData } from "@/src/lib/video/videodata";
import LikedDislikedVideosPanel from "./LikedDislikedVideosPanel";
import SavedVideosPanel from "./SavedVideosPanel";
import styles from "./setting.module.scss";

type CreatorProfileData = {
  name?: string;
  bio?: string;
  creator?: boolean;
  subscriber?: number;
  totalviews?: number;
  totalvideos?: number;
  profilePicUrl?: string;
};

type ModalType = "accounts" | "profiles" | "create" | "reset" | null;
type ReactionPanelTab = "liked" | "disliked";
type SettingsPanel =
  | "accounts"
  | "profiles"
  | "create"
  | "reset"
  | "saved"
  | "liked"
  | "disliked"
  | "notifications"
  | "notification-settings";

const ACTIVE_PROFILE_STORAGE_KEY = "activeProfileId";
const PANEL_QUERY_KEY = "panel";
const MODAL_PANELS = new Set<Exclude<ModalType, null>>([
  "accounts",
  "profiles",
  "create",
  "reset",
]);
const SETTINGS_PANELS = new Set<SettingsPanel>([
  "accounts",
  "profiles",
  "create",
  "reset",
  "saved",
  "liked",
  "disliked",
  "notifications",
  "notification-settings",
]);

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

export default function ProfileSettingPage() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileData | null>(null);
  const [accountProfiles, setAccountProfiles] = useState<AccountProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [storedUserName, setStoredUserName] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [resetDone, setResetDone] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDateOfBirth, setCreateDateOfBirth] = useState("");
  const [createPin, setCreatePin] = useState("");
  const [createAsPrimary, setCreateAsPrimary] = useState(false);
  const [reactionPanelTab, setReactionPanelTab] =
    useState<ReactionPanelTab>("liked");
  const [isReactionPanelOpen, setIsReactionPanelOpen] = useState(false);
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    setProfilesError("");

    try {
      const response = await getAccountProfiles();
      const profiles = Array.isArray(response.data) ? response.data : [];
      const storedActiveProfileId =
        typeof window !== "undefined"
          ? localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
          : null;
      const nextSelectedProfile =
        profiles.find((profile) => profile._id === storedActiveProfileId)?._id ||
        profiles.find((profile) => profile.isActive)?._id ||
        profiles.find((profile) => profile.isPrimary)?._id ||
        profiles[0]?._id ||
        "";

      setAccountProfiles(profiles);
      setSelectedProfileId(nextSelectedProfile);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load account profiles.");
      setProfilesError(message);
      setAccountProfiles([]);

      if (message.toLowerCase().includes("invalid authentication")) {
        toast.info("Please sign in again to manage profiles.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const response = await getCreatorProfileData();
        setCreatorProfile(response.data);
      } catch {
        setCreatorProfile({
          name: localStorage.getItem("userName") || "Vidorahub Creator",
          creator: true,
        });
      }
    };

    setToken(localStorage.getItem("token"));
    setStoredUserName(localStorage.getItem("userName") || "");
    fetchCreatorProfile();
    loadProfiles();
  }, [loadProfiles]);

  const selectedAccountProfile = useMemo(
    () => accountProfiles.find((profile) => profile._id === selectedProfileId),
    [accountProfiles, selectedProfileId]
  );

  const displayName =
    selectedAccountProfile?.name ||
    creatorProfile?.name ||
    "Vidorahub Creator";

  const avatarUrl =
    selectedAccountProfile?.profilePicUrl ||
    creatorProfile?.profilePicUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  const writePanelToUrl = useCallback(
    (panel: SettingsPanel | null, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());

      if (panel) {
        params.set(PANEL_QUERY_KEY, panel);
      } else {
        params.delete(PANEL_QUERY_KEY);
      }

      const queryString = params.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;

      if (mode === "replace") {
        router.replace(href, { scroll: false });
        return;
      }

      router.push(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const openPanel = useCallback(
    (panel: SettingsPanel) => {
      writePanelToUrl(panel);
    },
    [writePanelToUrl]
  );

  const closePanel = useCallback(() => {
    writePanelToUrl(null, "replace");
  }, [writePanelToUrl]);

  const closeModal = closePanel;

  useEffect(() => {
    const panelParam = searchParams.get(PANEL_QUERY_KEY);
    const panel = SETTINGS_PANELS.has(panelParam as SettingsPanel)
      ? (panelParam as SettingsPanel)
      : null;

    if (!panel) {
      setModalType(null);
      setIsSavedPanelOpen(false);
      setIsReactionPanelOpen(false);
      setIsNotificationsPanelOpen(false);
      if (panelParam) {
        writePanelToUrl(null, "replace");
      }
      return;
    }

    setModalType(
      MODAL_PANELS.has(panel as Exclude<ModalType, null>)
        ? (panel as Exclude<ModalType, null>)
        : null
    );
      setIsSavedPanelOpen(panel === "saved");
    setIsNotificationsPanelOpen(
      panel === "notifications" || panel === "notification-settings"
    );

    if (panel === "liked" || panel === "disliked") {
      setReactionPanelTab(panel);
      setIsReactionPanelOpen(true);
      return;
    }

    setIsReactionPanelOpen(false);
  }, [searchParams, writePanelToUrl]);

  const handleCreateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = createName.trim();
    if (!normalizedName) {
      toast.info("Profile name is required.");
      return;
    }

    if (
      accountProfiles.some(
        (profile) => profile.name.trim().toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      toast.info("A profile with this name already exists.");
      return;
    }

    setIsCreatingProfile(true);

    try {
      const response = await createAccountProfile({
        name: normalizedName,
        dateOfBirth: createDateOfBirth || undefined,
        isPrimary: createAsPrimary,
        pinHash: createPin.trim() || undefined,
      });

      const createdProfile = response.data;
      setAccountProfiles((profiles) => {
        const updatedProfiles = createAsPrimary
          ? profiles.map((profile) => ({ ...profile, isPrimary: false }))
          : profiles;

        return [...updatedProfiles, createdProfile];
      });
      setSelectedProfileId(createdProfile._id);
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, createdProfile._id);
      setCreateName("");
      setCreateDateOfBirth("");
      setCreatePin("");
      setCreateAsPrimary(false);
      closePanel();
      toast.success(response.message || "Profile created successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create profile."));
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSwitchProfile = async () => {
    if (!selectedProfileId) {
      toast.info("Choose a profile first.");
      return;
    }

    setIsSwitchingProfile(true);

    try {
      const response = await switchAccountProfile(selectedProfileId);
      const activeProfile = response.data;

      setAccountProfiles((profiles) =>
        profiles.map((profile) => ({
          ...profile,
          isActive: profile._id === activeProfile._id,
        }))
      );
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfile._id);
      closePanel();
      toast.success(response.message || "Profile switched successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to switch profile."));
    } finally {
      setIsSwitchingProfile(false);
    }
  };

  const confirmReset = () => {
    setResetDone(true);
    closePanel();
    toast.success("Preferences reset for this device.");
  };

  const openReactionPanel = (tab: ReactionPanelTab) => {
    openPanel(tab);
  };

  return (
    <div className={styles.page}>
      <div className={styles.backdrop}>
        <div className={styles.backdropOverlay} />
        <div className={styles.backdropImage} />
      </div>

      <Sidebar />

      <div className={styles.container}>
        <Header />

        <main className={styles.main}>
          <section className={styles.content}>
            <div className={styles.profilePanel}>
              <div className={styles.profileInfo}>
                <div
                  className={styles.avatar}
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                />
                <div>
                  <span className={styles.eyebrow}>Settings</span>
                  <h1>{displayName}</h1>
                  <p>
                    {creatorProfile?.bio ||
                      "Tune profiles, saved content, notifications and feedback controls from one place."}
                  </p>
                  {selectedAccountProfile && (
                    <span className={styles.activeMeta}>
                      {selectedAccountProfile.isPrimary ? "Primary profile" : "Profile"}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.profileAside}>
                <Link
                  href={`https://studio.vidorahub.com/login/${token || ""}`}
                  target="_blank"
                  className={styles.editProfileBtn}
                  aria-disabled={!token}
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit creator profile
                </Link>

                <div className={styles.stats}>
                  <div>
                    <span>Videos</span>
                    <b>{creatorProfile?.totalvideos ?? 0}</b>
                  </div>
                  <div>
                    <span>Views</span>
                    <b>{creatorProfile?.totalviews ?? 0}</b>
                  </div>
                  <div>
                    <span>Subscribers</span>
                    <b>{creatorProfile?.subscriber ?? 0}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.quickGrid}>
              <button onClick={() => openPanel("notifications")}>
                <span className="material-symbols-outlined">notifications</span>
                <b>Notifications</b>
                <small>Alerts and updates</small>
              </button>
              <button onClick={() => openPanel("saved")}>
                <span className="material-symbols-outlined">bookmark</span>
                <b>Saved videos</b>
                <small>Watch later list</small>
              </button>
              <button onClick={() => openReactionPanel("liked")}>
                <span className="material-symbols-outlined">thumb_up</span>
                <b>Liked videos</b>
                <small>Positive feedback</small>
              </button>
              <button onClick={() => openPanel("profiles")}>
                <span className="material-symbols-outlined">switch_account</span>
                <b>Profiles</b>
                <small>{accountProfiles.length || 0} available</small>
              </button>
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Accounts and profiles</h2>
                  <p>Control who is active on this device and add separate viewing spaces.</p>
                </div>
                <button className={styles.smallBtn} onClick={loadProfiles}>
                  <span className="material-symbols-outlined">sync</span>
                  Refresh
                </button>
              </div>

              {profilesError && (
                <div className={styles.inlineNotice}>
                  <span className="material-symbols-outlined">error</span>
                  <p>{profilesError}</p>
                </div>
              )}

              <div className={styles.actionList}>
                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("accounts")}
                >
                  <span className="material-symbols-outlined">switch_account</span>
                  <div>
                    <b>Current account</b>
                    <p>
                      Signed in as {creatorProfile?.name || storedUserName || "your Vidorahub account"}.
                    </p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("profiles")}
                  disabled={isLoadingProfiles}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <div>
                    <b>Switch profiles</b>
                    <p>
                      {isLoadingProfiles
                        ? "Loading your profiles..."
                        : accountProfiles.length
                          ? `${accountProfiles.length} profile${accountProfiles.length === 1 ? "" : "s"} available.`
                          : "Create your first profile for this account."}
                    </p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("create")}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <div>
                    <b>Create profile</b>
                    <p>Add a personal, creator, teen or kids profile to this account.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Feedback and preferences</h2>
                  <p>Review the content signals that shape recommendations and alerts.</p>
                </div>
              </div>

              <div className={styles.actionList}>
                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("saved")}
                >
                  <span className="material-symbols-outlined">bookmark</span>
                  <div>
                    <b>Saved videos</b>
                    <p>Open all videos you have saved for later.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openReactionPanel("liked")}
                >
                  <span className="material-symbols-outlined">thumb_up</span>
                  <div>
                    <b>Liked videos</b>
                    <p>Review the videos you have liked from this account.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openReactionPanel("disliked")}
                >
                  <span className="material-symbols-outlined">thumb_down</span>
                  <div>
                    <b>Disliked videos</b>
                    <p>Review the videos you have disliked from this account.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("reset")}
                >
                  <span className="material-symbols-outlined">restart_alt</span>
                  <div>
                    <b>Reset feedback and preferences</b>
                    <p>
                      Clear recommendation signals, muted topics and preference training.
                    </p>
                  </div>
                  <span className={styles.statusText}>
                    {resetDone ? "Reset" : "Ready"}
                  </span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => openPanel("notifications")}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  <div>
                    <b>Notifications</b>
                    <p>Control uploads, comments, creator updates and earning alerts.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <Link
                  href="https://about.vidorahub.com/privacypolicy"
                  target="_blank"
                  className={styles.actionItem}
                >
                  <span className="material-symbols-outlined">shield</span>
                  <div>
                    <b>Privacy policy</b>
                    <p>Open Vidorahub privacy policy in a new tab.</p>
                  </div>
                  <span className="material-symbols-outlined">open_in_new</span>
                </Link>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.actionList}>
                <Link
                  href="https://about.vidorahub.com"
                  target="_blank"
                  className={styles.actionItem}
                >
                  <span className="material-symbols-outlined">info</span>
                  <div>
                    <b>About Vidorahub</b>
                    <p>Open about.vidorahub.com in a new tab.</p>
                  </div>
                  <span className="material-symbols-outlined">open_in_new</span>
                </Link>

                <button className={`${styles.actionItem} ${styles.dangerItem}`}>
                  <span className="material-symbols-outlined">delete</span>
                  <div>
                    <b>Delete account</b>
                    <p>Permanently remove your account, profile and creator data.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </section>
          </section>
        </main>

        <Footer />
      </div>

      {modalType === "accounts" && (
        <SettingsModal
          title="Current account"
          description="Account switching is managed by sign in. Profiles inside this account can be switched below."
          onClose={closeModal}
          primaryLabel="Switch profiles"
          secondaryLabel="Close"
          onPrimary={() => openPanel("profiles")}
          onSecondary={closeModal}
        >
          <div className={styles.accountSummary}>
            <span className={styles.pickerAvatar}>{displayName.charAt(0)}</span>
            <div>
              <b>{creatorProfile?.name || "Vidorahub account"}</b>
              <p>
                {token
                  ? "Authenticated account"
                  : "No sign-in token found on this device"}
              </p>
            </div>
          </div>
        </SettingsModal>
      )}

      {modalType === "profiles" && (
        <SettingsModal
          title="Switch profiles"
          description="Pick the profile you want to use inside this account."
          onClose={closeModal}
          primaryLabel={isSwitchingProfile ? "Switching..." : "Switch"}
          secondaryLabel="Create"
          onPrimary={handleSwitchProfile}
          onSecondary={() => openPanel("create")}
          primaryDisabled={isSwitchingProfile || isLoadingProfiles || !selectedProfileId}
        >
          <ProfilePickerList
            items={accountProfiles}
            selectedId={selectedProfileId}
            isLoading={isLoadingProfiles}
            onSelect={setSelectedProfileId}
          />
        </SettingsModal>
      )}

      {modalType === "create" && (
        <SettingsModal
          title="Create profile"
          description="Add a new profile for this Vidorahub account."
          onClose={closeModal}
          primaryLabel={isCreatingProfile ? "Creating..." : "Create"}
          secondaryLabel="Cancel"
          onPrimary={() => {
            document
              .getElementById("create-profile-form")
              ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }}
          onSecondary={closeModal}
          primaryDisabled={isCreatingProfile}
        >
          <form
            id="create-profile-form"
            className={styles.profileForm}
            onSubmit={handleCreateProfile}
          >
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
            />

            <label>
              <span>PIN</span>
              <input
                value={createPin}
                maxLength={12}
                onChange={(event) => setCreatePin(event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={createAsPrimary}
                onChange={(event) => setCreateAsPrimary(event.target.checked)}
              />
              <span>Make primary profile</span>
            </label>
          </form>
        </SettingsModal>
      )}

      {modalType === "reset" && (
        <SettingsModal
          title="Reset preferences?"
          description="This will clear recommendation feedback, muted topics and preference training for this device."
          onClose={closeModal}
          primaryLabel="Yes"
          secondaryLabel="No"
          onPrimary={confirmReset}
          onSecondary={closeModal}
          danger
        />
      )}

      <LikedDislikedVideosPanel
        isOpen={isReactionPanelOpen}
        initialTab={reactionPanelTab}
        onTabChange={openReactionPanel}
        onClose={closePanel}
      />
      <SavedVideosPanel
        isOpen={isSavedPanelOpen}
        onClose={closePanel}
      />
      <NotificationsPanel
        isOpen={isNotificationsPanelOpen}
        view={
          searchParams.get(PANEL_QUERY_KEY) === "notification-settings"
            ? "settings"
            : "activity"
        }
        onOpenSettings={() => openPanel("notification-settings")}
        onBackToActivity={() => openPanel("notifications")}
        onClose={closePanel}
      />
    </div>
  );
}

type SettingsModalProps = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  children?: ReactNode;
  danger?: boolean;
  primaryDisabled?: boolean;
  onClose: () => void;
  onPrimary: () => void;
  onSecondary: () => void;
};

function SettingsModal({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  children,
  danger = false,
  primaryDisabled = false,
  onClose,
  onPrimary,
  onSecondary,
}: SettingsModalProps) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        {children && <div className={styles.modalBody}>{children}</div>}

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onSecondary}>
            {secondaryLabel}
          </button>
          <button
            className={`${styles.primaryBtn} ${danger ? styles.dangerBtn : ""}`}
            onClick={onPrimary}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type NotificationsPanelProps = {
  isOpen: boolean;
  view: "activity" | "settings";
  onOpenSettings: () => void;
  onBackToActivity: () => void;
  onClose: () => void;
};

const NOTIFICATION_ITEMS = [
  {
    title: "Your video reached 30 views",
    description: "Your upload is picking up early traction from viewers today.",
    time: "8 min ago",
    icon: "visibility",
    unread: true,
  },
  {
    title: "Your video is trending",
    description: "One of your videos is gaining faster engagement than usual.",
    time: "32 min ago",
    icon: "trending_up",
    unread: true,
  },
  {
    title: "New comment on your video",
    description: "A viewer added a comment to your latest upload.",
    time: "1 hr ago",
    icon: "mode_comment",
    unread: false,
  },
  {
    title: "Saved video reminder",
    description: "A creator you saved has posted a related video.",
    time: "Yesterday",
    icon: "bookmark",
    unread: false,
  },
];

const NOTIFICATION_GROUPS = [
  {
    title: "Creator updates",
    description: "Uploads, premieres and channel milestones from creators you follow.",
    icon: "subscriptions",
    enabled: true,
  },
  {
    title: "Comments and replies",
    description: "Activity on your videos, replies and meaningful conversation updates.",
    icon: "forum",
    enabled: true,
  },
  {
    title: "Earning alerts",
    description: "Revenue changes, payouts, campaigns and monetization notices.",
    icon: "payments",
    enabled: false,
  },
  {
    title: "Product and safety",
    description: "Account security, policy changes and important Vidorahub notices.",
    icon: "verified_user",
    enabled: true,
  },
];

function NotificationsPanel({
  isOpen,
  view,
  onOpenSettings,
  onBackToActivity,
  onClose,
}: NotificationsPanelProps) {
  const [settings, setSettings] = useState(NOTIFICATION_GROUPS);
  const enabledCount = settings.filter((item) => item.enabled).length;
  const unreadCount = NOTIFICATION_ITEMS.filter((item) => item.unread).length;

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay} role="dialog" aria-modal="true">
      <aside className={`${styles.reactionDrawer} ${styles.notificationsDrawer}`}>
        <div className={styles.drawerHeader}>
          <div>
            <span className={styles.eyebrow}>
              {view === "settings" ? "Notification settings" : "Notification center"}
            </span>
            <h3>{view === "settings" ? "Settings" : "Notifications"}</h3>
            <p className={styles.drawerDescription}>
              {view === "settings"
                ? "Choose which notification types should reach this profile."
                : "Recent activity about your videos, creators and account."}
            </p>
          </div>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close notifications panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {view === "activity" ? (
          <div className={styles.notificationSummary}>
            <span className="material-symbols-outlined">notifications_active</span>
            <div>
              <b>{unreadCount} new notifications</b>
              <p>Video performance, trend signals and viewer activity appear here.</p>
            </div>
          </div>
        ) : (
          <div className={styles.notificationSummary}>
            <span className="material-symbols-outlined">tune</span>
            <div>
              <b>{enabledCount} enabled</b>
              <p>These settings control what shows up in your notification center.</p>
            </div>
          </div>
        )}

        <div className={styles.drawerBody}>
          {view === "activity" ? (
            <div className={styles.notificationList}>
              {NOTIFICATION_ITEMS.map((item) => (
                <button
                  className={`${styles.notificationActivityItem} ${
                    item.unread ? styles.notificationUnread : ""
                  }`}
                  key={`${item.title}-${item.time}`}
                >
                  <span className={styles.notificationIcon}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <p>{item.description}</p>
                    <small>{item.time}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.notificationList}>
              {settings.map((item) => (
                <label className={styles.notificationItem} key={item.title}>
                  <span className={styles.notificationIcon}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <p>{item.description}</p>
                  </span>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSettings((current) =>
                        current.map((currentItem) =>
                          currentItem.title === item.title
                            ? { ...currentItem, enabled: checked }
                            : currentItem
                        )
                      );
                    }}
                    aria-label={`Toggle ${item.title}`}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.drawerFooter}>
          {view === "activity" ? (
            <>
              <button className={styles.secondaryBtn} onClick={onOpenSettings}>
                Settings
              </button>
              <button className={styles.primaryBtn} onClick={onClose}>
                Done
              </button>
            </>
          ) : (
            <>
              <button className={styles.secondaryBtn} onClick={onBackToActivity}>
                Back
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => setSettings(NOTIFICATION_GROUPS)}
              >
                Reset
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

type ProfilePickerListProps = {
  items: AccountProfile[];
  selectedId: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
};

function ProfilePickerList({
  items,
  selectedId,
  isLoading,
  onSelect,
}: ProfilePickerListProps) {
  if (isLoading) {
    return <div className={styles.emptyState}>Loading profiles...</div>;
  }

  if (!items.length) {
    return <div className={styles.emptyState}>No profiles found.</div>;
  }

  return (
    <div className={styles.pickerList}>
      {items.map((item) => {
        const selected = item._id === selectedId;

        return (
          <button
            key={item._id}
            className={`${styles.pickerItem} ${
              selected ? styles.pickerSelected : ""
            }`}
            onClick={() => onSelect(item._id)}
          >
            <span
              className={styles.pickerAvatar}
              style={
                item.profilePicUrl
                  ? { backgroundImage: `url(${item.profilePicUrl})` }
                  : undefined
              }
            >
              {!item.profilePicUrl && item.name.charAt(0)}
            </span>
            <div>
              <b>{item.name}</b>
              <p>{item.isPrimary ? "Primary profile" : "Account profile"}</p>
            </div>
            {(selected || item.isActive) && (
              <span className="material-symbols-outlined">check_circle</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
