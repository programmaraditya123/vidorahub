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

interface Props {
  videoSerialNumber: number;
}

export default function VideoActions({ videoSerialNumber }: Props) {
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userSerialNumber, setUserSerialNumber] = useState<number | null>(null);

  /*
  --------------------------------
  LOAD USER FROM LOCAL STORAGE
  --------------------------------
  */
  useEffect(() => {
    const storedUserSerial = localStorage.getItem("userSerialNumber");
    if (storedUserSerial) {
      setUserSerialNumber(Number(storedUserSerial));
    }
  }, []);

  /*
  --------------------------------
  LOAD REACTION STATE (SOURCE OF TRUTH)
  --------------------------------
  */
  useEffect(() => {
    if (!userSerialNumber) return;

    const loadReactions = async () => {
      try {
        const res = await getVideoReactions(
          userSerialNumber,
          videoSerialNumber
        );

        setLiked(res.liked);
        setDisliked(res.disliked);
        setLikeCount(res.likes);
        setDislikeCount(res.dislikes);
      } catch (err) {
        console.log("reaction load failed");
      }
    };

    loadReactions();
  }, [userSerialNumber, videoSerialNumber]);

  /*
  --------------------------------
  LIKE HANDLER
  --------------------------------
  */
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
    } catch {
      console.log("like error");
    } finally {
      setLoading(false);
    }
  };

  /*
  --------------------------------
  DISLIKE HANDLER
  --------------------------------
  */
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
    } catch {
      console.log("dislike error");
    } finally {
      setLoading(false);
    }
  };

  return (
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

      <button className={styles.shareBtn}>
        <span className="material-symbols-outlined">share</span>
        <span>Share</span>
      </button>
    </div>
  );
}
