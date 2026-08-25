"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
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

const ACTIVE_PROFILE_STORAGE_KEY = "activeProfileId";

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

  const closeModal = () => setModalType(null);

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
      closeModal();
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
      closeModal();
      toast.success(response.message || "Profile switched successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to switch profile."));
    } finally {
      setIsSwitchingProfile(false);
    }
  };

  const confirmReset = () => {
    setResetDone(true);
    closeModal();
    toast.success("Preferences reset for this device.");
  };

  const openReactionPanel = (tab: ReactionPanelTab) => {
    setReactionPanelTab(tab);
    setIsReactionPanelOpen(true);
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
              <Link
                href={`https://studio.vidorahub.com/login/${token || ""}`}
                target="_blank"
                className={styles.editProfileBtn}
                aria-disabled={!token}
              >
                <span className="material-symbols-outlined">edit</span>
                Edit
              </Link>

              <div className={styles.profileInfo}>
                <div
                  className={styles.avatar}
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                />
                <div>
                  <span className={styles.eyebrow}>Profile info</span>
                  <h1>{displayName}</h1>
                  <p>
                    {creatorProfile?.bio ||
                      "Manage account access, profiles, recommendations and Vidorahub preferences."}
                  </p>
                  {selectedAccountProfile && (
                    <span className={styles.activeMeta}>
                      {selectedAccountProfile.isPrimary ? "Primary profile" : "Profile"}
                    </span>
                  )}
                </div>
              </div>

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

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Accounts and profiles</h2>
                </div>
                <button className={styles.smallBtn} onClick={loadProfiles}>
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
                  onClick={() => setModalType("accounts")}
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
                  onClick={() => setModalType("profiles")}
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
                  onClick={() => setModalType("create")}
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
                </div>
              </div>

              <div className={styles.actionList}>
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
                  onClick={() => setModalType("reset")}
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

                <button className={styles.actionItem}>
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
          onPrimary={() => setModalType("profiles")}
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
          onSecondary={() => setModalType("create")}
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
        onClose={() => setIsReactionPanelOpen(false)}
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
