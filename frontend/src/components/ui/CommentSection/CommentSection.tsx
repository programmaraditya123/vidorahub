'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './CommentSection.module.scss'

type Comment = {
  id: string
  user: string
  avatar: string
  text: string
  likes: number
  time: string
  isCreator?: boolean
}

type Props = {
  totalComments: number
  comments: Comment[]
}

const CommentsSection = ({ totalComments, comments }: Props) => {
  const [input, setInput] = useState('')

  return (
    <section className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h3>{totalComments.toLocaleString()} Comments</h3>
      </div>

      {/* ADD COMMENT */}
      <div className={styles.addComment}>
        <Image
          src="/avatar.png"
          alt="You"
          width={36}
          height={36}
          className={styles.avatar}
        />
        <input
          placeholder="Add a comment..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </div>

      {/* COMMENT LIST */}
      <div className={styles.list}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.comment}>
            <Image
              src={comment.avatar}
              alt={comment.user}
              width={36}
              height={36}
              className={styles.avatar}
            />

            <div className={styles.content}>
              <div className={styles.userRow}>
                <span className={styles.user}>{comment.user}</span>
                {comment.isCreator && (
                  <span className={styles.creator}>Creator</span>
                )}
                <span className={styles.time}>{comment.time}</span>
              </div>

              <p className={styles.text}>{comment.text}</p>

              <div className={styles.actions}>
                <button>👍 {comment.likes}</button>
                <button>Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default CommentsSection;
