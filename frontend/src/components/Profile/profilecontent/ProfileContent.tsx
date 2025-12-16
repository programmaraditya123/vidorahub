'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './ProfileContent.module.scss'

type Video = {
  id: string
  title: string
  thumbnail: string
  views: string
  time: string
}

const videos: Video[] = [
  {
    id: '1',
    title: 'Vlog #25: A Day in the City',
    thumbnail: '/thumb1.jpg',
    views: '1.2M views',
    time: '2 days ago',
  },
  {
    id: '2',
    title: 'My Desk Setup Tour 2024',
    thumbnail: '/thumb2.jpg',
    views: '850K views',
    time: '1 week ago',
  },
  {
    id: '3',
    title: 'How to Cook the Perfect Pasta',
    thumbnail: '/thumb3.jpg',
    views: '2.3M views',
    time: '2 weeks ago',
  },
  {
    id: '4',
    title: 'Unboxing the New Tech Gadget',
    thumbnail: '/thumb4.jpg',
    views: '980K views',
    time: '3 weeks ago',
  },
  {
    id: '5',
    title: 'Gaming Highlights – Epic Wins',
    thumbnail: '/thumb5.jpg',
    views: '500K views',
    time: '1 month ago',
  },
  {
    id: '6',
    title: 'Travel Diary: The Mountains',
    thumbnail: '/thumb6.jpg',
    views: '1.8M views',
    time: '1 month ago',
  },
  {
    id: '7',
    title: '10 Tips for Better Productivity',
    thumbnail: '/thumb7.jpg',
    views: '750K views',
    time: '2 months ago',
  },
  {
    id: '8',
    title: 'DIY Home Decor Ideas',
    thumbnail: '/thumb8.jpg',
    views: '400K views',
    time: '2 months ago',
  },
]

const tabs = ['Videos', 'Playlists', 'History'] as const

const ProfileContent = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Videos')

  return (
    <section className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${
              activeTab === tab ? styles.active : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'Videos' && (
        <div className={styles.grid}>
          {videos.map((video) => (
            <div key={video.id} className={styles.card}>
              <div className={styles.thumbWrapper}>
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className={styles.thumbnail}
                />
              </div>

              <h3 className={styles.title}>{video.title}</h3>
              <p className={styles.meta}>
                {video.views} • {video.time}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab !== 'Videos' && (
        <div className={styles.placeholder}>
          {activeTab} content coming soon
        </div>
      )}
    </section>
  )
}

export default ProfileContent
