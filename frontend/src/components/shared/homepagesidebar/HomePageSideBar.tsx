'use client'

import Link from 'next/link'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import styles from './homepagesidebar.module.scss'

const HomePageSideBar = () => {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬣</span>
        <h1 className={styles.logoText}>Vidorahub</h1>
      </div>

      {/* Menu */}
      <nav className={styles.menu}>
        <ul>
          <li className={`${styles.item} ${styles.active}`}>
            <VidorahubIcon.HomeIcon width={20} height={20} />
            Home
          </li>

          <li className={styles.item}>
            <VidorahubIcon.FollowingIcon width={20} height={20} />
            Following
          </li>

          <li className={styles.item}>
          <Link href="/uploadvideo" className={styles.link}>
              <VidorahubIcon.UploadIcon width={20} height={20} />
              Upload
          </Link>
          </li>

          <li className={styles.item}>
            <VidorahubIcon.FileIcon width={20} height={20} />
            Library
          </li>

          <li className={styles.item}>
            <Link href="/profile" className={styles.link}>
            <VidorahubIcon.ProfileCircleIcon width={20} height={20} />
            Profile
            </Link>
          </li>

          <li className={styles.item}>
            <VidorahubIcon.SettingsIcon width={20} height={20} />
            Settings
          </li>
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className={styles.bottom}>
        <button className={styles.themeToggle}>
          <VidorahubIcon.MoonIcon width={18} height={18} />
          Theme
        </button>
      </div>
    </aside>
  )
}

export default HomePageSideBar