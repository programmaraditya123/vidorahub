"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./VideoMeta.module.scss";
import {
  followCreator,
  getFollowReaction,
  unfollowCreator,
} from "@/src/lib/video/likesDislikes";

interface Props {
  title: string;
  category: string;
  published: string;
  uploader: {
    _id: string;
    name: string;
    subscriber: number;
    userSerialNumber: number;
  };
}

export default function VideoMeta({
  title,
  category,
  published,
  uploader,
}: Props) {
  const [following, setFollowing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(uploader.subscriber);
  const [loading, setLoading] = useState(false);

  const creatorId = uploader._id;
  const creatorSerialNumber = uploader.userSerialNumber;

  const userSerialNumber =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userSerialNumber"))
      : undefined;

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
          creatorSerialNumber,
        );

        setFollowing(res.following);
      } catch (err) {
        console.error("Follow reaction error", err);
      }
    };

    loadReaction();
  }, [creatorId]);

  /*
    TOGGLE FOLLOW
  */

  const toggleSubscribe = async () => {
    if (!userSerialNumber || loading) return;

    setLoading(true);

    try {
      if (following) {
        const res = await unfollowCreator(
          creatorId,
          userSerialNumber,
          creatorSerialNumber,
        );

        setFollowing(false);
        setSubscriberCount(res.totalSubscribers);
      } else {
        const res = await followCreator(
          creatorId,
          userSerialNumber,
          creatorSerialNumber,
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
    <div className={styles.meta}>
      <div className={styles.top}>
        <span className={`${styles.category} neon-glow`}>{category}</span>
        <span className={styles.published}>Published {published}</span>
      </div>

      <h1 className={styles.title}>
        {title} <span className={styles.hash}>#024</span>
      </h1>

      <div className={styles.channelRow}>
        <div
          className={styles.avatar}
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB7l0EWz1hBqpdjmRYNzy7ggwUEvmYk-4CzCpwX1RSEZR8jc5B2W85SNXX4A5yW5V64bw9Vrutfyll7spm4H1iifX1_buEQ6Dc-tB9WNCHMp9hT17YJXhYu8PJY2Aw1wuE2PX3X66HMl60gdC1e6cYdJz2FgUNF6WrZuUIjsDPjJpLNQ-IHg1F3-wgqJLi045QB5I4Lal9SOmRyArMS7pWAgcupMFgFaJMW8S3MvJf7BHVncFqhXoPYf2k9ViJsFga5QDJikEIQf8U1')",
          }}
        ></div>

        <div className={styles.channelInfo} key={uploader._id}>
          <Link href={`/channel/${uploader._id}`}>
            <h3>{uploader.name}</h3>
            <p>{subscriberCount} subscribers</p>
          </Link>
        </div>

        <button
          className={`${styles.subscribe} ${
            following ? styles.subscribed : ""
          }`}
          onClick={toggleSubscribe}
          disabled={loading}
        >
          {loading ? "..." : following ? "Subscribed" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}
