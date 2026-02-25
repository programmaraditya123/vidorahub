"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./VibeMeta.module.scss";
import {
  followCreator,
  unfollowCreator,
  getFollowReaction,
} from "@/src/lib/video/likesDislikes";

interface Props {
 uploader: {
  _id: string;
  name: string;
  profilePicture?: string;
  subscriber: number;
  userSerialNumber: number;
   
};
}

export default function VibeMeta({ uploader }: Props) {
  const [following, setFollowing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(
    uploader.subscriber
  );
  const [loading, setLoading] = useState(false);

  const creatorId = uploader._id;
  const creatorSerialNumber = uploader.userSerialNumber;

  const userSerialNumber =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userSerialNumber"))
      : undefined;

  const getFallbackAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;

  /*
    LOAD FOLLOW STATUS
  */
  useEffect(() => {
    if (!userSerialNumber) return;

    const loadReaction = async () => {
      try {
        const res = await getFollowReaction(
          creatorId,
          userSerialNumber,
          creatorSerialNumber
        );

        setFollowing(res.following);
      } catch (err) {
        console.error("Follow reaction error", err);
      }
    };

    loadReaction();
  }, [creatorId]);

  /*
    TOGGLE SUBSCRIBE
  */
  const toggleSubscribe = async () => {
    if (!userSerialNumber || loading) return;

    setLoading(true);

    try {
      if (following) {
        const res = await unfollowCreator(
          creatorId,
          userSerialNumber,
          creatorSerialNumber
        );

        setFollowing(false);
        setSubscriberCount(res.totalSubscribers);
      } else {
        const res = await followCreator(
          creatorId,
          userSerialNumber,
          creatorSerialNumber
        );

        setFollowing(true);
        setSubscriberCount(res.totalSubscribers);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.vibeMeta}>
      <div className={styles.left}>
        <img
          src={
            uploader.profilePicture ||
            getFallbackAvatar(uploader.name)
          }
          alt="profile"
          className={styles.avatar}
        />

        <div className={styles.info}>
          <Link href={`/channel/${uploader._id}`}>
            <h4>{uploader.name}</h4>
          </Link>
          <span>{subscriberCount} subscribers</span>
        </div>
      </div>

      <button
        className={`${styles.subscribeBtn} ${
          following ? styles.subscribed : ""
        }`}
        onClick={toggleSubscribe}
        disabled={loading}
      >
        {loading ? "..." : following ? "Subscribed" : "Subscribe"}
      </button>
    </div>
  );
}