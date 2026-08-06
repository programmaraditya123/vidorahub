
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/src/components/ProfilePage/Header";
import Footer from "@/src/components/ProfilePage/Footer";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import { getCreatorProfileData } from "@/src/lib/video/videodata";
import styles from "./setting.module.scss";

type ProfileData = {
  name?: string;
  bio?: string;
  creator?: boolean;
  subscriber?: number;
  totalviews?: number;
  totalvideos?: number;
  profilePicUrl?: string;
};

type ModalType = "accounts" | "profiles" | "reset" | null;

type PickerItem = {
  id: string;
  name: string;
  description: string;
};

export default function SettingPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedAccount, setSelectedAccount] = useState("aditya");
  const [selectedProfile, setSelectedProfile] = useState("aditya");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getCreatorProfileData();
        setProfile(res.data);
      } catch {
        setProfile({
          name: localStorage.getItem("userName") || "Vidorahub Creator",
          creator: true,
        });
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const avatarUrl =
    profile?.profilePicUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || "Vidorahub"}`;

  const accounts: PickerItem[] = [
    {
      id: "aditya",
      name: profile?.name || "Aditya",
      description: "Current account",
    },
    { id: "preet", name: "Preet", description: "Saved creator account" },
    { id: "kids", name: "Kids", description: "Supervised account" },
  ];

  const profiles: PickerItem[] = [
    { id: "aditya", name: "Aditya", description: "Primary profile" },
    { id: "preet", name: "Preet", description: "Creator profile" },
    { id: "kids", name: "Kids", description: "Kids profile" },
  ];

  const closeModal = () => setModalType(null);

  const confirmReset = () => {
    setResetDone(true);
    closeModal();
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
                  <h1>{profile?.name || "Vidorahub Creator"}</h1>
                  <p>
                    {profile?.bio ||
                      "Manage account access, profiles, recommendations and Vidorahub preferences."}
                  </p>
                </div>
              </div>
              

              <div className={styles.stats}>
                <div>
                  <span>Videos</span>
                  <b>{profile?.totalvideos ?? 0}</b>
                </div>
                <div>
                  <span>Views</span>
                  <b>{profile?.totalviews ?? 0}</b>
                </div>
                <div>
                  <span>Subscribers</span>
                  <b>{profile?.subscriber ?? 0}</b>
                </div>
              </div>
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  {/* <span className={styles.eyebrow}>Account</span> */}
                  <h2>Accounts and profiles</h2>
                </div>
                {/* <button className={styles.smallBtn}>Manage</button> */}
              </div>

              <div className={styles.actionList}>
                <button
                  className={styles.actionItem}
                  onClick={() => setModalType("accounts")}
                >
                  <span className="material-symbols-outlined">switch_account</span>
                  <div>
                    <b>Switch accounts</b>
                    <p>Move between saved Vidorahub accounts on this device.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <button
                  className={styles.actionItem}
                  onClick={() => setModalType("profiles")}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <div>
                    <b>Switch profiles</b>
                    <p>Choose between profiles like Preet, Aditya and Kids.</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  {/* <span className={styles.eyebrow}>Experience</span> */}
                  <h2>Feedback and preferences</h2>
                </div>
              </div>

              <div className={styles.actionList}>
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
          title="Switch accounts"
          description="Choose the saved account you want to continue with."
          onClose={closeModal}
          primaryLabel="Change"
          secondaryLabel="New account"
          onPrimary={closeModal}
          onSecondary={closeModal}
        >
          <PickerList
            items={accounts}
            selectedId={selectedAccount}
            onSelect={setSelectedAccount}
          />
        </SettingsModal>
      )}

      {modalType === "profiles" && (
        <SettingsModal
          title="Switch profiles"
          description="Pick the profile you want to use inside this account."
          onClose={closeModal}
          primaryLabel="Switch"
          secondaryLabel="Create"
          onPrimary={closeModal}
          onSecondary={closeModal}
        >
          <PickerList
            items={profiles}
            selectedId={selectedProfile}
            onSelect={setSelectedProfile}
          />
        </SettingsModal>
      )}

      {modalType === "reset" && (
        <SettingsModal
          title="Reset preferences?"
          description="This will clear recommendation feedback, muted topics and preference training for this profile."
          onClose={closeModal}
          primaryLabel="Yes"
          secondaryLabel="No"
          onPrimary={confirmReset}
          onSecondary={closeModal}
          danger
        />
      )}
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
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type PickerListProps = {
  items: PickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function PickerList({ items, selectedId, onSelect }: PickerListProps) {
  return (
    <div className={styles.pickerList}>
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <button
            key={item.id}
            className={`${styles.pickerItem} ${selected ? styles.pickerSelected : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.pickerAvatar}>{item.name.charAt(0)}</span>
            <div>
              <b>{item.name}</b>
              <p>{item.description}</p>
            </div>
            {selected && (
              <span className="material-symbols-outlined">check_circle</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
