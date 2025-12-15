'use client'

import Image from 'next/image'
import styles from './VideoMetaBar.module.scss'

type Props = {
  title: string
  channelName: string
  channelImage: string
  subscribers?: string
}

const VideoMetaBar = ({
  title,
  channelName,
  channelImage,
  subscribers = '—'
}: Props) => {
  return (
    <div className={styles.wrapper}>
      {/* TITLE */}
      <h1 className={styles.title}>{title}</h1>

      {/* META ROW */}
      <div className={styles.metaRow}>
        {/* LEFT: CHANNEL INFO */}
        <div className={styles.channel}>
          <Image
            src={channelImage}
            alt={channelName}
            width={40}
            height={40}
            className={styles.avatar}
          />
          <div>
            <p className={styles.channelName}>
              {channelName} <span className={styles.verified}>✔</span>
            </p>
            <p className={styles.subscribers}>{subscribers} Followers</p>
          </div>

          <button className={styles.subscribeBtn}>Follow</button>
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className={styles.actions}>
          <button>👍 123K</button>
          <button>👎</button>
          <button>Share</button>
          <button>Clip</button>
          <button>Save</button>
          <button className={styles.more}>⋯</button>
        </div>
      </div>
    </div>
  )
}

export default VideoMetaBar
