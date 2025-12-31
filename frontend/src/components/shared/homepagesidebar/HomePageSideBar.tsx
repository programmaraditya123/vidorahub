'use client'

import Link from 'next/link'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import styles from './homepagesidebar.module.scss'
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks'
import { toggleSidebar } from '@/src/redux/slices/uiSlice'

const HomePageSideBar = () => {
  const dispatch = useAppDispatch()
  const isCollapsed = useAppSelector((state) => state.ui.isCollapsed)

  return (
    <aside
      className={`${styles.sidebar} ${
        isCollapsed ? styles.collapsed : ''
      }`}
    >
      {/* Logo */}
      <div className={styles.logo}>
        {!isCollapsed && <h1 className={styles.logoText}>Vidorahub</h1>}
        <span className={styles.logoIcon} onClick={() => dispatch(toggleSidebar())}>{<VidorahubIcon.BarIcon width={20} height={20}/>}</span>
      </div>

      {/* Menu */}
      <nav className={styles.menu}>
        <ul>
          <li className={styles.item}>
            <VidorahubIcon.HomeIcon width={20} height={20} />
            {!isCollapsed && <span>Home</span>}
          </li>

          <li className={styles.item}>
            <VidorahubIcon.FollowingIcon width={20} height={20} />
            {!isCollapsed && <span>Following</span>}
          </li>

          <li className={styles.item}>
            <Link href="/uploadvideo" className={styles.link}>
              <VidorahubIcon.UploadIcon width={20} height={20} />
              {!isCollapsed && <span>Upload</span>}
            </Link>
          </li>

          <li className={styles.item}>
            <VidorahubIcon.FileIcon width={20} height={20} />
            {!isCollapsed && <span>Library</span>}
          </li>

          <li className={styles.item}>
            <Link href="/profile" className={styles.link}>
              <VidorahubIcon.ProfileCircleIcon width={20} height={20} />
              {!isCollapsed && <span>Profile</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <button
          className={styles.themeToggle}
          
        >
          <VidorahubIcon.MoonIcon width={18} height={18} />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export default HomePageSideBar
