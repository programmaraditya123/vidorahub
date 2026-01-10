'use client'

import { useState } from 'react'
import styles from './CategoryTabs.module.scss'
// import VidorahubIcon from '@/src/icons/VidorahubIcon'

type Tab = {
  id: string
  label: string
  icon?: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  // { id: 'followers', label: 'Followers' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'art', label: 'Art', icon: '🎨' },
]

const CategoryTabs = () => {
  const [active, setActive] = useState('for-you')

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              active === tab.id ? styles.active : ''
            }`}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryTabs
