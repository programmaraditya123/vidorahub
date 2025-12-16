'use client'

import ProfileHeader from "@/src/components/Profile/ProfileHeader/ProfileHeader"
import ProfileNavbar from "@/src/components/shared/profilenavbar/ProfileNavbar"
import styles from '../page.module.css'
import ProfileStats from "@/src/components/Profile/profilestats/ProfileStats"
import ProfileContent from "@/src/components/Profile/profilecontent/ProfileContent"


const Page = () => {
  return (
    <div className={styles.profilecont}>
        <ProfileNavbar/>
        <div className={styles.childcont}>
        <ProfileHeader
            name="Alex Thompson"
            username="alexthompson"
            bio="Creating content about tech, design, and everything in between. Join me on this journey!"
            onEditProfile={() => console.log('Edit profile')}
            onAccountSettings={() => console.log('Account settings')}
            />
            <ProfileStats
                stats={[
                    { label: 'Videos', value: 128 },
                    { label: 'Subscribers', value: '1.2M' },
                    { label: 'Following', value: 450 },
                ]}
                />
                <ProfileContent/>

            </div>

    </div>
  )
}

export default Page