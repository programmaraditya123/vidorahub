'use client'

import Image from 'next/image'
import styles from './UpNextSidebar.module.scss'

type VideoItem = {
  id: string
  title: string
  channel: string
  views: string
  uploaded: string
  duration: string
  thumbnail: string
}

type Props = {
  videos: VideoItem[]
  autoplay?: boolean
  onToggleAutoplay?: (value: boolean) => void
}

const UpNextSidebar = ({
  videos,
  autoplay = true,
  onToggleAutoplay
}: Props) => {
  return (
    <aside className={styles.sidebar}>
      {/* HEADER */}
      <div className={styles.header}>
        <h3>Up Next</h3>

        <div className={styles.autoplay}>
          <span>Autoplay</span>
          <button
            className={`${styles.toggle} ${autoplay ? styles.on : ''}`}
            onClick={() => onToggleAutoplay?.(!autoplay)}
          >
            <span />
          </button>
        </div>
      </div>

      {/* VIDEO LIST */}
      <div className={styles.list}>
        {videos.map(video => (
          <div key={video.id} className={styles.item}>
            {/* THUMBNAIL */}
            <div className={styles.thumb}>
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className={styles.thumbImg}
              />
              <span className={styles.duration}>{video.duration}</span>
            </div>

            {/* INFO */}
            <div className={styles.info}>
              <p className={styles.title}>{video.title}</p>
              <p className={styles.channel}>{video.channel}</p>
              <p className={styles.meta}>
                {video.views} views • {video.uploaded}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default UpNextSidebar
