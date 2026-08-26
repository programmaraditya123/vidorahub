"use client";

import { useEffect, useState } from "react";
import styles from "./VideoActions.module.scss";
import {
  addLike,
  removeLike,
  addDislike,
  removeDislike,
  getVideoReactions,
} from "@/src/lib/video/likesDislikes";
import {
  getSaveVideoStatus,
  saveVideo,
  unsaveVideo,
} from "@/src/lib/video/savevideo";
import ShareBlade from "../../ui/ShareBlade/ShareBlade";
import AuthModal from "../../shared/AuthModal/AuthModal";

interface Props {
  videoId: string;
  videoSerialNumber: number;
  thumbnailUrl: string;
}

export default function VideoActions({
  videoId,
  videoSerialNumber,
  thumbnailUrl,
}: Props) {
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [userSerialNumber, setUserSerialNumber] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const canUseSaveApi = /^[a-f\d]{24}$/i.test(videoId);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserSerial = localStorage.getItem("userSerialNumber");

    setIsAuthenticated(Boolean(token));

    if (token && storedUserSerial) {
      setUserSerialNumber(Number(storedUserSerial));
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    const loadReactions = async () => {
      try {
        const res = await getVideoReactions(
          videoSerialNumber,
          userSerialNumber ?? undefined,
        );

        setLiked(res.liked);
        setDisliked(res.disliked);
        setLikeCount(res.likes);
        setDislikeCount(res.dislikes);
      } catch {
        console.log("reaction load failed");
      }
    };

    loadReactions();
  }, [authChecked, userSerialNumber, videoSerialNumber]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !canUseSaveApi) return;

    const loadSaveStatus = async () => {
      try {
        const res = await getSaveVideoStatus(videoId);
        setSaved(Boolean(res.data?.isSaved));
      } catch {
        setSaved(false);
      }
    };

    loadSaveStatus();
  }, [authChecked, canUseSaveApi, isAuthenticated, videoId]);

  const handleLike = async () => {
    if (!userSerialNumber) {
      setModalMessage("Sign in to like this video.");
      setShowModal(true);
      return;
    }
    if (loading || !userSerialNumber) return;

    setLoading(true);

    try {
      const res = liked
        ? await removeLike({ userSerialNumber, videoSerialNumber })
        : await addLike({ userSerialNumber, videoSerialNumber });

      setLiked(res.liked);
      setDisliked(res.disliked);
      setLikeCount(res.likes);
      setDislikeCount(res.dislikes);
    } catch {
      setModalMessage("Sign in to like this video.");
      setShowModal(true);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!userSerialNumber) {
      setModalMessage("Sign in to dislike this video.");
      setShowModal(true);
      return;
    }
    if (loading || !userSerialNumber) return;

    setLoading(true);

    try {
      const res = disliked
        ? await removeDislike({ userSerialNumber, videoSerialNumber })
        : await addDislike({ userSerialNumber, videoSerialNumber });

      setLiked(res.liked);
      setDisliked(res.disliked);
      setLikeCount(res.likes);
      setDislikeCount(res.dislikes);
    } catch {
      setModalMessage("Sign in to dislike this video.");
      setShowModal(true);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setModalMessage("Sign in to save this video.");
      setShowModal(true);
      return;
    }

    if (!canUseSaveApi) {
      setModalMessage("This video cannot be saved right now.");
      setShowModal(true);
      return;
    }

    if (saveLoading) return;

    setSaveLoading(true);

    try {
      if (saved) {
        await unsaveVideo(videoId);
        setSaved(false);
      } else {
        await saveVideo(videoId);
        setSaved(true);
      }
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : saved
            ? "Unable to remove this video from saved videos."
            : "Unable to save this video.";

      setModalMessage(message);
      setShowModal(true);
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    setFullUrl(window.location.href);
  }, []);

  return (
    <>
      <div className={styles.actionsWrapper}>
        <div className={styles.likeBar}>
          <button
            className={`${styles.likeBtn} ${liked ? styles.activeLike : ""}`}
            onClick={handleLike}
            disabled={loading}
          >
            <span className="material-symbols-outlined">thumb_up</span>
            <span className={styles.likeCount}>{likeCount}</span>
          </button>

          <div className={styles.divider}></div>

          <button
            className={`${styles.dislikeBtn} ${
              disliked ? styles.activeDislike : ""
            }`}
            onClick={handleDislike}
            disabled={loading}
          >
            <span className="material-symbols-outlined">thumb_down</span>
            <span className={styles.likeCount}>{dislikeCount}</span>
          </button>
        </div>

        <button className={styles.shareBtn} onClick={() => setShareOpen(true)}>
          <span className="material-symbols-outlined">share</span>
          <span>Share</span>
        </button>

        <button
          className={`${styles.saveBtn} ${saved ? styles.savedBtn : ""}`}
          onClick={handleSave}
          disabled={saveLoading}
          aria-pressed={saved}
        >
          <span className="material-symbols-outlined">
            {saved ? "bookmark_added" : "bookmark"}
          </span>
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
        <ShareBlade
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          thumbnailUrl={thumbnailUrl}
          link={fullUrl}
        />
      </div>
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
      />
    </>
  );
}
