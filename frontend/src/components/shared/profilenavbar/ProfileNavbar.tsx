'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './ProfileNavbar.module.scss'

const ProfileNavbar = () => {
  const router = useRouter()

  return (
    <header className={styles.navbar}>
      {/* Left */}
      <div className={styles.left}>
        <div className={styles.logo} onClick={() => router.push('/')}>
          <span className={styles.logoIcon} />
          <span className={styles.logoText}>Vidorahub</span>
        </div>

        <nav className={styles.links}>
          <Link href="/">Home</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/subscriptions">Subscriptions</Link>
        </nav>
      </div>

      {/* Center */}
      <div className={styles.center}>
        <input
          type="text"
          placeholder="Search"
          className={styles.search}
        />
      </div>

      {/* Right */}
      <div className={styles.right}>
        <button
          className={styles.uploadBtn}
          onClick={() => router.push('/uploadvideo')}
        >
          Upload
        </button>

        <button className={styles.iconBtn}>🔔</button>
        <button className={styles.iconBtn}>⏻</button>

        <div className={styles.avatar}>
          <Image
            src="/avatar.png" // replace or keep placeholder
            alt="User"
            width={32}
            height={32}
          />
        </div>
      </div>
    </header>
  )
}

export default ProfileNavbar
