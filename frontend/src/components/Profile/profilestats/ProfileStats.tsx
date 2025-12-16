'use client'

import styles from './ProfileStats.module.scss'

type StatItem = {
  label: string
  value: string | number
}

type ProfileStatsProps = {
  stats: StatItem[]
}

const ProfileStats = ({ stats }: ProfileStatsProps) => {
  return (
    <section className={styles.container}>
      {stats.map((stat, index) => (
        <div className={styles.card} key={index}>
          <h2 className={styles.value}>{stat.value}</h2>
          <p className={styles.label}>{stat.label}</p>
        </div>
      ))}
    </section>
  )
}

export default ProfileStats
