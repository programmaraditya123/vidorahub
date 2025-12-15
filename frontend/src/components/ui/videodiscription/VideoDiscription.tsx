'use client'

import { useState } from 'react'
import styles from './VideoDiscription.module.scss'

type Props = {
  views: string
  uploaded: string
  hashtags?: string[]
  description: string
}

const VideoDescription = ({
  views,
  uploaded,
  hashtags = [],
  description
}: Props) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.wrapper}>
      {/* META */}
      <div className={styles.meta}>
        <span>{views} views</span>
        <span>•</span>
        <span>{uploaded}</span>
      </div>

      {/* HASHTAGS */}
      {hashtags.length > 0 && (
        <div className={styles.tags}>
          {hashtags.map(tag => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}

      {/* DESCRIPTION */}
      <p className={`${styles.description} ${expanded ? styles.expanded : ''}`}>
        {description}
      </p>

      {/* TOGGLE */}
      <button
        className={styles.toggle}
        onClick={() => setExpanded(prev => !prev)}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}

export default VideoDescription
