"use client";

import { useEffect, useState } from "react";
import styles from "./VibeActions.module.scss";
import {
  addLike,
  removeLike,
  addDislike,
  removeDislike,
  getVideoReactions,
} from "@/src/lib/video/likesDislikes";
import ShareBlade from "../../ui/ShareBlade/ShareBlade";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

interface Props {
  videoSerialNumber: number;
  thumbnailUrl: string;
  totalViews : Number;
}

export default function VibeActions({
  videoSerialNumber,
  thumbnailUrl,
  totalViews,
}: Props) {
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [userSerialNumber, setUserSerialNumber] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [fullUrl, setFullUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserSerial = localStorage.getItem("userSerialNumber");

    if (token && storedUserSerial) {
      setUserSerialNumber(Number(storedUserSerial));
    }

    setAuthChecked(true);
    setFullUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    const loadReactions = async () => {
      try {
        const res = await getVideoReactions(
          videoSerialNumber,
          userSerialNumber ?? undefined
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
  }, [authChecked, videoSerialNumber]);

  const handleLike = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.sidebar}>
        {/* LIKE */}
          <div className={`${styles.actionBtn} ${styles.viewsBtn}`}>
    <VidorahubIcon.EyeIcon />
    <span className={styles.count}>
      {totalViews.toLocaleString()}
    </span>
  </div>
        <button
          className={`${styles.actionBtn} ${liked ? styles.active : ""}`}
          onClick={handleLike}
          disabled={loading || !userSerialNumber}
        >
          <span className="material-symbols-outlined">favorite</span>
          <span className={styles.count}>{likeCount}</span>
        </button>

        {/* DISLIKE */}
        <button
          className={`${styles.actionBtn} ${
            disliked ? styles.activeDislike : ""
          }`}
          onClick={handleDislike}
          disabled={loading || !userSerialNumber}
        >
          <span className="material-symbols-outlined">thumb_down</span>
          <span className={styles.count}>{dislikeCount}</span>
        </button>

        {/* SHARE */}
        <button
          className={styles.actionBtn}
          onClick={() => setShareOpen(true)}
        >
          <span className="material-symbols-outlined">share</span>
          <span className={styles.count}>Share</span>
        </button>
      </div>

      <ShareBlade
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        thumbnailUrl={thumbnailUrl}
        link={fullUrl}
      />
    </>
  );
}