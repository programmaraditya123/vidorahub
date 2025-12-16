'use client'

import Link from 'next/link'
import styles from './not-found.module.scss'

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.glow} />

      <div className={styles.card}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Page Not Found</h2>

        <p className={styles.description}>
          Oops! The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Go Home
          </Link>

          <Link href="/" className={styles.secondaryBtn}>
            Explore Videos
          </Link>
        </div>
      </div>
    </div>
  )
}
