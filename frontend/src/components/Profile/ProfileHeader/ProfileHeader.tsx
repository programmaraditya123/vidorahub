'use client'

import Image from 'next/image'
import styles from './ProfileHeader.module.scss'

type ProfileHeaderProps = {
  name: string
  username: string
  bio?: string
  avatar?: string
  onEditProfile?: () => void
  onAccountSettings?: () => void
}

const ProfileHeader = ({
  name,
  username,
  bio,
  avatar = '/avatar.png',
  onEditProfile,
  onAccountSettings,
}: ProfileHeaderProps) => {
  return (
    <section className={styles.container}>
      {/* Left */}
      <div className={styles.left}>
        <div className={styles.avatar}>
          <Image
            src={avatar}
            alt={name}
            width={72}
            height={72}
            priority
          />
        </div>

        <div className={styles.info}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.username}>@{username}</p>

          {bio && <p className={styles.bio}>{bio}</p>}
        </div>
      </div>

      {/* Right */}
      <div className={styles.actions}>
        <button
          className={styles.secondaryBtn}
          onClick={onEditProfile}
        >
          Edit Profile
        </button>

        <button
          className={styles.primaryBtn}
          onClick={onAccountSettings}
        >
          Account Settings
        </button>
      </div>
    </section>
  )
}

export default ProfileHeader
