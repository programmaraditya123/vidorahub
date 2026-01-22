"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./CommentSection.module.scss";
import { http } from "@/src/lib/http";
import { getVideoId } from "@/src/utils/videoStorage";
import fallbackThumbnail from "../../../images/sample1.png";

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
  likes: number;
  replies?: Comment[];
}

export default function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const videoId =
    typeof window !== "undefined" ? getVideoId() : null;

  // ==============================
  // FETCH COMMENTS
  // ==============================
  const fetchComments = async () => {
    if (!videoId) return;

    try {
      const res = await http.get(
        `/api/v1/getVedioComments/${videoId}?page=1&limit=10`
      );

      setComments(res.data.data); // ✅ array
      setTotalComments(res.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  // ==============================
  // POST COMMENT
  // ==============================
  const handlePostComment = async () => {
    if (!text.trim() || !videoId) return;

    try {
      setLoading(true);

      await http.post(`/api/v1/postVedioComments/${videoId}`, {
        content: text.trim(),
      });

      setText("");
      fetchComments(); // refresh list
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  // ==============================
  // UI
  // ==============================
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
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className={styles.sendBtn}
          onClick={handlePostComment}
          disabled={loading}
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>

      {/* LIST */}
      <div className={styles.commentList}>
        {comments.map((c) => (
          <div className={styles.commentRow} key={c._id}>
            <Image
              src={c.user.avatar || fallbackThumbnail}
              width={36}
              height={36}
              alt={c.user.name}
              className={styles.avatar}
            />

            <div className={`${styles.bubble} glass-dark`}>
              <div className={styles.meta}>
                <span className={styles.username}>
                  @{c.user.name}
                </span>
                <span className={styles.time}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className={styles.text}>{c.content}</p>

              <div className={styles.actions}>
                <span className="material-symbols-outlined">thumb_up</span>
                <span className="material-symbols-outlined">reply</span>
              </div>

              {/* REPLIES */}
              {c.replies?.map((r) => (
                <div className={styles.commentRow} key={r._id}>
                  <Image
                    src={r.user.avatar || fallbackThumbnail}
                    width={30}
                    height={30}
                    alt={r.user.name}
                    className={styles.avatar}
                  />

                  <div className={`${styles.bubble} glass-dark`}>
                    <div className={styles.meta}>
                      <span className={styles.username}>
                        @{r.user.name}
                      </span>
                      <span className={styles.time}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className={styles.text}>{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}









// "use client";

// import Image from "next/image";
// import styles from "./CommentSection.module.scss";

// interface Comment {
//   id: string;
//   user: string;
//   avatar: string;
//   text: string;
//   likes: number;
//   time: string;
//   isCreator?: boolean;
// }

// interface Props {
//   totalComments: number;
//   comments: Comment[];
// }

// export default function CommentsSection({ totalComments, comments }: Props) {
//   return (
//     <div className={styles.wrapper}>
//       {/* HEADER */}
//       <div className={styles.header}>
//         <h2 className={styles.title}>Comments</h2>
//         <span className={styles.count}>{totalComments} Threads</span>
//       </div>

//       {/* INPUT */}
//       <div className={styles.inputWrapper}>
//         <input
//           type="text"
//           placeholder="Share your thoughts..."
//           className={styles.input}
//         />
//         <button className={styles.sendBtn}>
//           <span className="material-symbols-outlined">send</span>
//         </button>
//       </div>

//       {/* LIST */}
//       <div className={styles.commentList}>
//         {comments.map((c) => (
//           <div className={styles.commentRow} key={c.id}>
//             <Image
//               src={c.avatar}
//               width={36}
//               height={36}
//               alt={c.user}
//               className={styles.avatar}
//             />

//             <div className={`${styles.bubble} glass-dark`}>
//               <div className={styles.meta}>
//                 <span
//                   className={`${styles.username} ${
//                     c.isCreator ? styles.creator : ""
//                   }`}
//                 >
//                   @{c.user}
//                 </span>
//                 <span className={styles.time}>{c.time}</span>
//               </div>

//               <p className={styles.text}>{c.text}</p>

//               <div className={styles.actions}>
//                 <span className="material-symbols-outlined">thumb_up</span>
//                 <span className="material-symbols-outlined">reply</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
