"use client";

import Image from "next/image";
import styles from "./CommentSection.module.scss";

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  time: string;
  isCreator?: boolean;
}

interface Props {
  totalComments: number;
  comments: Comment[];
}

export default function CommentsSection({ totalComments, comments }: Props) {
  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Comments</h2>
        <span className={styles.count}>{totalComments} Threads</span>
      </div>

      {/* INPUT */}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          placeholder="Share your thoughts..."
          className={styles.input}
        />
        <button className={styles.sendBtn}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>

      {/* LIST */}
      <div className={styles.commentList}>
        {comments.map((c) => (
          <div className={styles.commentRow} key={c.id}>
            <Image
              src={c.avatar}
              width={36}
              height={36}
              alt={c.user}
              className={styles.avatar}
            />

            <div className={`${styles.bubble} glass-dark`}>
              <div className={styles.meta}>
                <span
                  className={`${styles.username} ${
                    c.isCreator ? styles.creator : ""
                  }`}
                >
                  @{c.user}
                </span>
                <span className={styles.time}>{c.time}</span>
              </div>

              <p className={styles.text}>{c.text}</p>

              <div className={styles.actions}>
                <span className="material-symbols-outlined">thumb_up</span>
                <span className="material-symbols-outlined">reply</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
