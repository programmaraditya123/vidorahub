"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./CommentSection.module.scss";
import { http } from "@/src/lib/http";
import { getVideoId } from "@/src/utils/videoStorage";
import fallbackThumbnail from "../../../images/sample1.png";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  user: User;
  content: string;
  createdAt: string;
  replies?: Comment[];
  optimistic?: boolean;
}

const tempId = () => `temp-${Date.now()}`;

export default function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const videoId =
    typeof window !== "undefined" ? getVideoId() : null;

  useEffect(() => {
    if (!videoId) return;
    http
      .get(`/api/v1/getVedioComments/${videoId}?page=1&limit=20`)
      .then((res) => setComments(res.data.data));
  }, [videoId]);

 
  const insertReply = (
    tree: Comment[],
    parentId: string,
    reply: Comment
  ): Comment[] =>
    tree.map((c) =>
      c._id === parentId
        ? { ...c, replies: [...(c.replies || []), reply] }
        : {
            ...c,
            replies: c.replies
              ? insertReply(c.replies, parentId, reply)
              : [],
          }
    );

  const handlePost = async (parentId?: string) => {
    const content = parentId ? replyText : text;
    if (!content.trim() || !videoId) return;

    const optimisticComment: Comment = {
      _id: tempId(),
      content,
      createdAt: new Date().toISOString(),
      optimistic: true,
      user: { _id: "me", name: "You" },
      replies: [],
    };

    // optimistic UI update
    if (parentId) {
      setComments((prev) =>
        insertReply(prev, parentId, optimisticComment)
      );
      setReplyText("");
      setReplyTo(null);
    } else {
      setComments((prev) => [optimisticComment, ...prev]);
      setText("");
    }

    try {
      const res = await http.post(
        `/api/v1/postVedioComments/${videoId}`,
        {
          content,
          parentComment: parentId,
        }
      );

      const real = res.data.data;

      // replace temp with real
      setComments((prev) =>
        JSON.parse(
          JSON.stringify(prev).replace(
            optimisticComment._id,
            real._id
          )
        )
      );
    } catch {
      // rollback on failure
      setComments((prev) =>
        prev.filter((c) => c._id !== optimisticComment._id)
      );
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

const autoResize = () => {
  const el = textareaRef.current;
  if (!el) return;

  el.style.height = "auto";                // reset first
  el.style.height = el.scrollHeight + "px"; // grow to content
};

 
  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => (
    <div
      className={styles.commentRow}
      style={{ marginLeft: depth * 28 }}
    >
      <Image
        src={comment.user.avatar || fallbackThumbnail}
        width={depth ? 28 : 36}
        height={depth ? 28 : 36}
        alt={comment.user.name}
        className={styles.avatar}
      />

      <div
        className={`${styles.bubble} glass-dark ${
          comment.optimistic ? styles.optimistic : ""
        }`}
      >
        <div className={styles.meta}>
          <span className={styles.username}>
            @{comment.user.name}
          </span>
          <span className={styles.time}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        <p className={styles.text}>{comment.content}</p>

        {/* <div className={styles.actions}>
          <span
            className="material-symbols-outlined"
            onClick={() => setReplyTo(comment._id)}
          >
            reply
          </span>
        </div> */}

        {/* {replyTo === comment._id && (
          <div className={styles.replyBox}>
            <input
              className={styles.input}
              placeholder="Write a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button
              className={styles.sendBtn}
              onClick={() => handlePost(comment._id)}
            >
              <span className="material-symbols-outlined">
                send
              </span>
            </button>
          </div>
        )} */}

        {comment.replies?.map((r) => (
          <CommentItem
            key={r._id}
            comment={r}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        <textarea
  ref={textareaRef}
  className={styles.input}
  placeholder="Share your thoughts…"
  value={text}
  rows={1}
  onChange={(e) => {
    setText(e.target.value);
    autoResize();
  }}
/>
        <button
          className={styles.sendBtn}
          onClick={() => handlePost()}
        >
          <span><VidorahubIcon.SendIcon size={24}/></span>
        </button>
      </div>

      <div className={styles.commentList}>
        {comments.map((c) => (
          <CommentItem key={c._id} comment={c} />
        ))}
      </div>
    </div>
  );
}
